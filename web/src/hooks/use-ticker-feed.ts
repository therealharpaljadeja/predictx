"use client";

import { useQuery } from "@tanstack/react-query";

export interface TickerItem {
  text: string;
  marketId: number;
}

interface TickerFeedResponse {
  bets: TickerItem[];
  metrics: TickerItem[];
}

async function fetchTickerFeed(): Promise<TickerFeedResponse> {
  const res = await fetch("/api/ticker-feed");
  if (!res.ok) throw new Error("Failed to fetch ticker feed");
  return res.json();
}

export function useTickerFeed() {
  return useQuery({
    queryKey: ["ticker-feed"],
    queryFn: fetchTickerFeed,
    refetchInterval: 30_000,
    staleTime: 25_000,
  });
}
