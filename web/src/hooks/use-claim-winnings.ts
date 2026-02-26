"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { BettingPoolABI } from "@/lib/abis";
import { CONTRACTS } from "@/lib/contracts";

export function useClaimWinnings() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function claim(marketId: number) {
    writeContract({
      address: CONTRACTS.BettingPool,
      abi: BettingPoolABI,
      functionName: "claim",
      args: [BigInt(marketId)],
    });
  }

  return { claim, hash, isPending, isConfirming, isSuccess, error, reset };
}

export function useRefund() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function refund(marketId: number) {
    writeContract({
      address: CONTRACTS.BettingPool,
      abi: BettingPoolABI,
      functionName: "refund",
      args: [BigInt(marketId)],
    });
  }

  return { refund, hash, isPending, isConfirming, isSuccess, error, reset };
}
