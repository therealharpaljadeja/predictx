"use client";

import { useQuery } from "@tanstack/react-query";

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL ?? "";

export interface BetRecord {
  user: `0x${string}`;
  side: number;
  amount: bigint;
  timestamp: bigint;
  transactionHash: `0x${string}`;
}

interface SubgraphBet {
  user: string;
  side: string;
  amount: string;
  timestampParam: string;
  transactionHash_: string;
}

const BET_HISTORY_QUERY = `
  query BetHistory($marketId: BigInt!) {
    betPlaceds(
      where: { marketId: $marketId }
      orderBy: timestampParam
      orderDirection: desc
      first: 10
    ) {
      user
      side
      amount
      timestampParam
      transactionHash_
    }
  }
`;

async function fetchBetHistory(marketId: number): Promise<BetRecord[]> {
  if (!SUBGRAPH_URL) return [];

  const res = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: BET_HISTORY_QUERY,
      variables: { marketId: marketId.toString() },
    }),
  });

  const json = await res.json();
  const bets: SubgraphBet[] = json.data?.betPlaceds ?? [];

  return bets.map((b) => ({
    user: b.user as `0x${string}`,
    side: Number(b.side),
    amount: BigInt(b.amount),
    timestamp: BigInt(b.timestampParam),
    transactionHash: b.transactionHash_ as `0x${string}`,
  }));
}

export function useBetHistory(marketId: number) {
  return useQuery({
    queryKey: ["bet-history", marketId],
    queryFn: () => fetchBetHistory(marketId),
    refetchInterval: 10_000,
    enabled: !!SUBGRAPH_URL,
  });
}
