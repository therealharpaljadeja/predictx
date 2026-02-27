"use client";

import { useReadContract } from "wagmi";
import { MarketResolutionABI } from "@/lib/abis";
import { CONTRACTS } from "@/lib/contracts";

const POLL_INTERVAL = 5_000;

export function useResolution(marketId: number) {
  return useReadContract({
    address: CONTRACTS.MarketResolution,
    abi: MarketResolutionABI,
    functionName: "getResolution",
    args: [BigInt(marketId)],
    query: { refetchInterval: POLL_INTERVAL },
  });
}

export function useOutcome(marketId: number) {
  return useReadContract({
    address: CONTRACTS.MarketResolution,
    abi: MarketResolutionABI,
    functionName: "getOutcome",
    args: [BigInt(marketId)],
    query: { refetchInterval: POLL_INTERVAL },
  });
}
