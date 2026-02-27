"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionButton } from "@/components/shared/transaction-button";
import { useClaimWinnings, useRefund } from "@/hooks/use-claim-winnings";
import { usePosition, usePool } from "@/hooks/use-pool";
import { useResolution } from "@/hooks/use-resolution";
import { MarketStatus } from "@/types/market";
import { formatUSDC } from "@/lib/utils";
import { Trophy, ArrowDownLeft } from "lucide-react";

interface ClaimWinningsProps {
  marketId: number;
  status: MarketStatus;
}

export function ClaimWinnings({ marketId, status }: ClaimWinningsProps) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { data: position } = usePosition(marketId, address);
  const { data: pool } = usePool(marketId);
  const { data: resolution } = useResolution(marketId);

  const { claim, isPending: isClaimPending, isConfirming: isClaimConfirming, isSuccess: isClaimSuccess, error: claimError, reset: resetClaim } = useClaimWinnings();
  const { refund, isPending: isRefundPending, isConfirming: isRefundConfirming, isSuccess: isRefundSuccess, error: refundError, reset: resetRefund } = useRefund();

  useEffect(() => {
    if (isClaimSuccess) {
      toast.success("Winnings claimed successfully");
      queryClient.invalidateQueries();
    }
  }, [isClaimSuccess, queryClient]);

  useEffect(() => {
    if (isRefundSuccess) {
      toast.success("Refund claimed successfully");
      queryClient.invalidateQueries();
    }
  }, [isRefundSuccess, queryClient]);

  useEffect(() => {
    if (claimError) {
      toast.error("Claim failed", { description: claimError.message.split("\n")[0] });
      resetClaim();
    }
  }, [claimError, resetClaim]);

  useEffect(() => {
    if (refundError) {
      toast.error("Refund failed", { description: refundError.message.split("\n")[0] });
      resetRefund();
    }
  }, [refundError, resetRefund]);

  if (!address || !position) return null;

  const hasPosition = (position.yesAmount > 0n) || (position.noAmount > 0n);
  if (!hasPosition) return null;

  if (status === MarketStatus.Cancelled && !position.refunded) {
    const totalRefund = position.yesAmount + position.noAmount;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
            Claim Refund
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground font-mono">This market was cancelled. Claim your refund below.</p>
          <p className="text-lg font-mono font-bold">${formatUSDC(totalRefund)} USDC</p>
          <TransactionButton
            onClick={() => refund(marketId)}
            isPending={isRefundPending}
            isConfirming={isRefundConfirming}
            className="w-full"
          >
            Claim Refund
          </TransactionButton>
        </CardContent>
      </Card>
    );
  }

  if (status === MarketStatus.Resolved && !position.claimed && resolution && pool) {
    const targetMet = resolution.targetMet;
    const userWinningBet = targetMet ? position.yesAmount : position.noAmount;

    if (userWinningBet === 0n) {
      return (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
            You lost this market. Better luck next time.
          </CardContent>
        </Card>
      );
    }

    const totalPool = pool.totalYesAmount + pool.totalNoAmount;
    const winningPool = targetMet ? pool.totalYesAmount : pool.totalNoAmount;
    const payout = winningPool > 0n ? (userWinningBet * totalPool) / winningPool : 0n;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-widest flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            You Won
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-lg font-mono font-bold">${formatUSDC(payout)} USDC</p>
          <TransactionButton
            onClick={() => claim(marketId)}
            isPending={isClaimPending}
            isConfirming={isClaimConfirming}
            className="w-full"
          >
            Claim Winnings
          </TransactionButton>
        </CardContent>
      </Card>
    );
  }

  if (position.claimed) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
          Winnings claimed
        </CardContent>
      </Card>
    );
  }

  return null;
}
