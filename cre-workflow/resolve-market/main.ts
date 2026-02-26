import {
  CronCapability,
  EVMClient,
  HTTPClient,
  handler,
  Runner,
  getNetwork,
  LATEST_BLOCK_NUMBER,
  encodeCallMsg,
  bytesToHex,
  hexToBase64,
  consensusMedianAggregation,
  type Runtime,
  type NodeRuntime,
} from "@chainlink/cre-sdk";
import { encodeFunctionData, decodeFunctionResult, encodeAbiParameters, parseAbiParameters, zeroAddress } from "viem";

// MarketRegistry ABI fragments
const MarketRegistryABI = [
  {
    type: "function" as const,
    name: "nextMarketId",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view" as const,
  },
  {
    type: "function" as const,
    name: "getMarket",
    inputs: [{ name: "marketId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "description", type: "string" },
          { name: "endpointPath", type: "string" },
          { name: "jsonPath", type: "string" },
          { name: "targetValue", type: "uint256" },
          { name: "operator", type: "uint8" },
          { name: "bettingDeadline", type: "uint48" },
          { name: "resolutionDate", type: "uint48" },
          { name: "createdAt", type: "uint48" },
          { name: "status", type: "uint8" },
          { name: "creator", type: "address" },
        ],
      },
    ],
    stateMutability: "view" as const,
  },
] as const;

type Config = {
  schedule: string;
  marketRegistryAddress: string;
  marketResolutionAddress: string;
  chainName: string;
  gasLimit: string;
  apiBaseUrl: string;
};

const STATUS_RESOLVED = 2;
const STATUS_CANCELLED = 3;

function resolveJsonPath(obj: unknown, path: string): number {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      throw new Error("Cannot resolve path '" + path + "' at key '" + key + "'");
    }
    current = (current as Record<string, unknown>)[key];
  }
  if (typeof current !== "number") {
    throw new Error("Value at path '" + path + "' is not a number: " + String(current));
  }
  return Math.floor(current);
}

const onCronTrigger = (runtime: Runtime<Config>): string => {
  const config = runtime.config;

  // Get chain selector
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: config.chainName,
    isTestnet: true,
  });
  if (!network) {
    throw new Error("Unknown chain: " + config.chainName);
  }

  const evmClient = new EVMClient(network.chainSelector.selector);
  const httpClient = new HTTPClient();

  runtime.log("PredictX: Checking for markets to resolve...");

  // 1. Read nextMarketId
  const nextIdCallData = encodeFunctionData({
    abi: MarketRegistryABI,
    functionName: "nextMarketId",
  });

  const nextIdReply = evmClient
    .callContract(runtime, {
      call: encodeCallMsg({
        from: zeroAddress,
        to: config.marketRegistryAddress as `0x${string}`,
        data: nextIdCallData,
      }),
      blockNumber: LATEST_BLOCK_NUMBER,
    })
    .result();

  const marketCount = decodeFunctionResult({
    abi: MarketRegistryABI,
    functionName: "nextMarketId",
    data: bytesToHex(nextIdReply.data),
  }) as bigint;

  runtime.log("Found " + marketCount.toString() + " total markets");

  const now = Math.floor(runtime.now().getTime() / 1000);
  let resolvedCount = 0;

  // 2. Iterate markets
  for (let i = 0; i < Number(marketCount); i++) {
    const getMarketCallData = encodeFunctionData({
      abi: MarketRegistryABI,
      functionName: "getMarket",
      args: [BigInt(i)],
    });

    const marketReply = evmClient
      .callContract(runtime, {
        call: encodeCallMsg({
          from: zeroAddress,
          to: config.marketRegistryAddress as `0x${string}`,
          data: getMarketCallData,
        }),
        blockNumber: LATEST_BLOCK_NUMBER,
      })
      .result();

    const market = decodeFunctionResult({
      abi: MarketRegistryABI,
      functionName: "getMarket",
      data: bytesToHex(marketReply.data),
    }) as {
      description: string;
      endpointPath: string;
      jsonPath: string;
      targetValue: bigint;
      operator: number;
      bettingDeadline: number;
      resolutionDate: number;
      createdAt: number;
      status: number;
      creator: string;
    };

    // Skip resolved/cancelled
    if (market.status >= STATUS_RESOLVED) continue;

    // Skip if not yet time to resolve
    if (market.resolutionDate > now) continue;

    runtime.log(
      "Market #" + i + ": endpoint=" + market.endpointPath +
      ", target=" + market.targetValue.toString() +
      ", resolving..."
    );

    // 3. Fetch value from API (node mode with consensus)
    const bearerToken = runtime.getSecret({ id: "X_API_BEARER_TOKEN" }).result().value;

    const fetchValue = (nodeRuntime: NodeRuntime<Config>): number => {
      const nodeHttpClient = new HTTPClient();
      const resp = nodeHttpClient
        .sendRequest(nodeRuntime, {
          url: config.apiBaseUrl + market.endpointPath,
          method: "GET" as const,
          headers: {
            Authorization: "Bearer " + bearerToken,
          },
        })
        .result();

      const bodyText = new TextDecoder().decode(resp.body);
      const body = JSON.parse(bodyText);
      return resolveJsonPath(body, market.jsonPath);
    };

    // Run across nodes with median consensus
    const getValue = runtime.runInNodeMode(
      fetchValue,
      consensusMedianAggregation<number>()
    );
    const actualValue = getValue().result();

    runtime.log(
      "Fetched value for market #" + i + ": " + actualValue
    );

    // 4. Encode report payload: (marketId, actualValue)
    const reportData = encodeAbiParameters(
      parseAbiParameters("uint256 marketId, uint256 actualValue"),
      [BigInt(i), BigInt(actualValue)]
    );

    // 5. Create signed report
    const reportResponse = runtime
      .report({
        encodedPayload: hexToBase64(reportData),
        encoderName: "evm",
        signingAlgo: "ecdsa",
        hashingAlgo: "keccak256",
      })
      .result();

    // 6. Submit report to MarketResolution contract via writeReport
    const writeReportResult = evmClient
      .writeReport(runtime, {
        receiver: config.marketResolutionAddress,
        report: reportResponse,
        gasConfig: {
          gasLimit: config.gasLimit,
        },
      })
      .result();

    const txHash = bytesToHex(writeReportResult.txHash || new Uint8Array(32));
    runtime.log(
      "Resolved market #" + i +
      " (value=" + actualValue + ") tx: " + txHash
    );

    resolvedCount++;
  }

  runtime.log("Done. Found " + resolvedCount + " markets ready to resolve.");
  return "Found " + resolvedCount + " markets to resolve";
};

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [
    handler(cron.trigger({ schedule: config.schedule }), onCronTrigger),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
