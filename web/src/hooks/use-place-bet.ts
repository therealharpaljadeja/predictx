"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { BettingPoolABI } from "@/lib/abis";
import { CONTRACTS } from "@/lib/contracts";
import { BetSide } from "@/types/market";

export function usePlaceBet() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function placeBet(marketId: number, side: BetSide, amount: bigint) {
    writeContract({
      address: CONTRACTS.BettingPool,
      abi: BettingPoolABI,
      functionName: "placeBet",
      args: [BigInt(marketId), side, amount],
    });
  }

  return { placeBet, hash, isPending, isConfirming, isSuccess, error, reset };
}
