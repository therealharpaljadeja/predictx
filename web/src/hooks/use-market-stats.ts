"use client";

import { useQuery } from "@tanstack/react-query";

interface Snapshot {
  value: number;
  timestamp: number;
}

interface MarketStatsResponse {
  marketId: number;
  snapshots: Snapshot[];
}

async function fetchMarketStats(marketId: number): Promise<MarketStatsResponse> {
  const res = await fetch(`/api/market-stats/${marketId}`);
  if (!res.ok) throw new Error("Failed to fetch market stats");
  return res.json();
}

export function useMarketStats(marketId: number) {
  return useQuery({
    queryKey: ["marketStats", marketId],
    queryFn: () => fetchMarketStats(marketId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });
}
