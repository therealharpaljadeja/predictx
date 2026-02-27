"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { MarketRegistryABI } from "@/lib/abis";
import { CONTRACTS } from "@/lib/contracts";
import { Market, MarketStatus, ComparisonOperator } from "@/types/market";

const POLL_INTERVAL = 5_000;

export function useMarketCount() {
  return useReadContract({
    address: CONTRACTS.MarketRegistry,
    abi: MarketRegistryABI,
    functionName: "nextMarketId",
    query: { refetchInterval: POLL_INTERVAL },
  });
}

export function useMarket(id: number) {
  const { data, ...rest } = useReadContract({
    address: CONTRACTS.MarketRegistry,
    abi: MarketRegistryABI,
    functionName: "getMarket",
    args: [BigInt(id)],
    query: { refetchInterval: POLL_INTERVAL },
  });

  const market: Market | undefined = data
    ? {
        id,
        description: data.description,
        endpointPath: data.endpointPath,
        jsonPath: data.jsonPath,
        targetValue: data.targetValue,
        operator: data.operator as ComparisonOperator,
        bettingDeadline: Number(data.bettingDeadline),
        resolutionDate: Number(data.resolutionDate),
        createdAt: Number(data.createdAt),
        status: data.status as MarketStatus,
        creator: data.creator,
      }
    : undefined;

  return { data: market, ...rest };
}

export function useMarkets() {
  const { data: count } = useMarketCount();
  const marketCount = count ? Number(count) : 0;

  const contracts = Array.from({ length: marketCount }, (_, i) => ({
    address: CONTRACTS.MarketRegistry,
    abi: MarketRegistryABI,
    functionName: "getMarket" as const,
    args: [BigInt(i)] as const,
  }));

  const { data, ...rest } = useReadContracts({ contracts, query: { refetchInterval: POLL_INTERVAL } });

  const markets: Market[] =
    data
      ?.map((result, i) => {
        if (result.status !== "success" || !result.result) return null;
        const d = result.result;
        return {
          id: i,
          description: d.description,
          endpointPath: d.endpointPath,
          jsonPath: d.jsonPath,
          targetValue: d.targetValue,
          operator: d.operator as ComparisonOperator,
          bettingDeadline: Number(d.bettingDeadline),
          resolutionDate: Number(d.resolutionDate),
          createdAt: Number(d.createdAt),
          status: d.status as MarketStatus,
          creator: d.creator,
        };
      })
      .filter((m): m is Market => m !== null) ?? [];

  return { data: markets, ...rest };
}
