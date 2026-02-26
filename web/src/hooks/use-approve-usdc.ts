"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ERC20ABI } from "@/lib/abis";
import { CONTRACTS } from "@/lib/contracts";

export function useUSDCAllowance(owner: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20ABI,
    functionName: "allowance",
    args: owner ? [owner, CONTRACTS.BettingPool] : undefined,
    query: { enabled: !!owner },
  });
}

export function useUSDCBalance(owner: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: owner ? [owner] : undefined,
    query: { enabled: !!owner },
  });
}

export function useApproveUSDC() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function approve(amount: bigint) {
    writeContract({
      address: CONTRACTS.USDC,
      abi: ERC20ABI,
      functionName: "approve",
      args: [CONTRACTS.BettingPool, amount],
    });
  }

  return { approve, hash, isPending, isConfirming, isSuccess, error, reset };
}
