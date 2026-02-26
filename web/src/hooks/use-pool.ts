"use client";

import { useReadContract } from "wagmi";
import { BettingPoolABI } from "@/lib/abis";
import { CONTRACTS } from "@/lib/contracts";

export function usePool(marketId: number) {
  return useReadContract({
    address: CONTRACTS.BettingPool,
    abi: BettingPoolABI,
    functionName: "getPool",
    args: [BigInt(marketId)],
  });
}

export function usePosition(marketId: number, user: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.BettingPool,
    abi: BettingPoolABI,
    functionName: "getPosition",
    args: user ? [BigInt(marketId), user] : undefined,
    query: { enabled: !!user },
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
