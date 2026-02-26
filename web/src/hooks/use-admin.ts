"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { MarketRegistryABI, MarketResolutionABI } from "@/lib/abis";
import { CONTRACTS } from "@/lib/contracts";

export function useCreateMarket() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function createMarket(
    description: string,
    endpointPath: string,
    jsonPath: string,
    targetValue: bigint,
    operator: number,
    bettingDeadline: number,
    resolutionDate: number
  ) {
    writeContract({
      address: CONTRACTS.MarketRegistry,
      abi: MarketRegistryABI,
      functionName: "createMarket",
      args: [description, endpointPath, jsonPath, targetValue, operator, bettingDeadline, resolutionDate],
    });
  }

  return { createMarket, hash, isPending, isConfirming, isSuccess, error, reset };
}

export function useRequestSettlement() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function requestSettlement(marketId: number) {
    writeContract({
      address: CONTRACTS.MarketResolution,
      abi: MarketResolutionABI,
      functionName: "requestSettlement",
      args: [BigInt(marketId)],
    });
  }

  return { requestSettlement, hash, isPending, isConfirming, isSuccess, error, reset };
}
