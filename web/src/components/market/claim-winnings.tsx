"use client";

import { useAccount } from "wagmi";
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
  const { address } = useAccount();
  const { data: position } = usePosition(marketId, address);
  const { data: pool } = usePool(marketId);
  const { data: resolution } = useResolution(marketId);

  const { claim, isPending: isClaimPending, isConfirming: isClaimConfirming } = useClaimWinnings();
  const { refund, isPending: isRefundPending, isConfirming: isRefundConfirming } = useRefund();

  if (!address || !position) return null;

  const hasPosition = (position.yesAmount > 0n) || (position.noAmount > 0n);
  if (!hasPosition) return null;

  if (status === MarketStatus.Cancelled && !position.refunded) {
    const totalRefund = position.yesAmount + position.noAmount;
    return (
      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowDownLeft className="h-5 w-5 text-amber-400" />
            Claim Refund
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">This market was cancelled. Claim your refund below.</p>
          <p className="text-lg font-semibold">${formatUSDC(totalRefund)} USDC</p>
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
        <Card className="border-red-500/30">
          <CardContent className="py-6 text-center text-red-400">
            You lost this market. Better luck next time!
          </CardContent>
        </Card>
      );
    }

    const totalPool = pool.totalYesAmount + pool.totalNoAmount;
    const winningPool = targetMet ? pool.totalYesAmount : pool.totalNoAmount;
    const payout = winningPool > 0n ? (userWinningBet * totalPool) / winningPool : 0n;

    return (
      <Card className="border-emerald-500/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-emerald-400" />
            You Won!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-lg font-semibold text-emerald-400">${formatUSDC(payout)} USDC</p>
          <TransactionButton
            onClick={() => claim(marketId)}
            isPending={isClaimPending}
            isConfirming={isClaimConfirming}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Claim Winnings
          </TransactionButton>
        </CardContent>
      </Card>
    );
  }

  if (position.claimed) {
    return (
      <Card className="border-emerald-500/30">
        <CardContent className="py-6 text-center text-emerald-400">
          Winnings claimed!
        </CardContent>
      </Card>
    );
  }

  return null;
}
