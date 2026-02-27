import { publicClient } from "@/lib/viem-client";
import { MarketRegistryABI } from "@/lib/abis";
import { CONTRACTS } from "@/lib/contracts";
import { MarketStatus } from "@/types/market";

interface UnresolvedMarket {
  id: number;
  endpointPath: string;
  jsonPath: string;
  targetValue: bigint;
  status: number;
}

export async function getUnresolvedMarkets(): Promise<UnresolvedMarket[]> {
  const nextId = await publicClient.readContract({
    address: CONTRACTS.MarketRegistry,
    abi: MarketRegistryABI,
    functionName: "nextMarketId",
  });

  const marketCount = Number(nextId);
  if (marketCount === 0) return [];

  const calls = Array.from({ length: marketCount }, (_, i) => ({
    address: CONTRACTS.MarketRegistry,
    abi: MarketRegistryABI,
    functionName: "getMarket" as const,
    args: [BigInt(i)] as const,
  }));

  const results = await publicClient.multicall({ contracts: calls });

  const markets: UnresolvedMarket[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status !== "success" || !r.result) continue;

    const status = r.result.status as number;
    // Only include Open (0) or Closed (1) — not Resolved or Cancelled
    if (status === MarketStatus.Open || status === MarketStatus.Closed) {
      markets.push({
        id: i,
        endpointPath: r.result.endpointPath,
        jsonPath: r.result.jsonPath,
        targetValue: r.result.targetValue,
        status,
      });
    }
  }

  return markets;
}
