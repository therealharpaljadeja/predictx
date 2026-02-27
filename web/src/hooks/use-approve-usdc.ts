"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ERC20ABI } from "@/lib/abis";
import { CONTRACTS } from "@/lib/contracts";

const POLL_INTERVAL = 5_000;

export function useUSDCAllowance(owner: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20ABI,
    functionName: "allowance",
    args: owner ? [owner, CONTRACTS.BettingPool] : undefined,
    query: { enabled: !!owner, refetchInterval: POLL_INTERVAL },
  });
}

export function useUSDCBalance(owner: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.USDC,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: owner ? [owner] : undefined,
    query: { enabled: !!owner, refetchInterval: POLL_INTERVAL },
  });
}

export function useApproveUSDC() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const MAX_UINT256 = 2n ** 256n - 1n;

  function approve() {
    writeContract({
      address: CONTRACTS.USDC,
      abi: ERC20ABI,
      functionName: "approve",
      args: [CONTRACTS.BettingPool, MAX_UINT256],
    });
  }

  return { approve, hash, isPending, isConfirming, isSuccess, error, reset };
}
