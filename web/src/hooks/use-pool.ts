"use client";

import { useReadContract } from "wagmi";
import { BettingPoolABI } from "@/lib/abis";
import { CONTRACTS } from "@/lib/contracts";

const POLL_INTERVAL = 5_000;

export function usePool(marketId: number) {
  return useReadContract({
    address: CONTRACTS.BettingPool,
    abi: BettingPoolABI,
    functionName: "getPool",
    args: [BigInt(marketId)],
    query: { refetchInterval: POLL_INTERVAL },
  });
}

export function usePosition(marketId: number, user: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.BettingPool,
    abi: BettingPoolABI,
    functionName: "getPosition",
    args: user ? [BigInt(marketId), user] : undefined,
    query: { enabled: !!user, refetchInterval: POLL_INTERVAL },
  });
}

export function usePotentialPayout(marketId: number, side: number, amount: bigint) {
  return useReadContract({
    address: CONTRACTS.BettingPool,
    abi: BettingPoolABI,
    functionName: "calculatePotentialPayout",
    args: [BigInt(marketId), side, amount],
    query: { enabled: amount > 0n },
  });
}
