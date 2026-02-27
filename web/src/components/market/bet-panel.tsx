"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionButton } from "@/components/shared/transaction-button";
import { USDCAmountInput } from "@/components/shared/usdc-amount-input";
import { ConnectWalletPrompt } from "@/components/shared/connect-wallet-prompt";
import { usePlaceBet } from "@/hooks/use-place-bet";
import { useApproveUSDC, useUSDCAllowance, useUSDCBalance } from "@/hooks/use-approve-usdc";
import { usePotentialPayout } from "@/hooks/use-pool";
import { BetSide } from "@/types/market";
import { parseUSDC, formatUSDC } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface BetPanelProps {
  marketId: number;
  isOpen: boolean;
}

export function BetPanel({ marketId, isOpen }: BetPanelProps) {
  const queryClient = useQueryClient();
  const { address, isConnected } = useAccount();
  const [side, setSide] = useState<BetSide>(BetSide.Yes);
  const [amount, setAmount] = useState("");

  const parsedAmount = parseUSDC(amount);

  const { data: allowance } = useUSDCAllowance(address);
  const { data: balance } = useUSDCBalance(address);
  const { data: payout } = usePotentialPayout(marketId, side, parsedAmount);

  const needsApproval = allowance !== undefined && parsedAmount > 0n && allowance < parsedAmount;

  const {
    approve,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isSuccess: isApproveSuccess,
    error: approveError,
    reset: resetApprove,
  } = useApproveUSDC();

  const {
    placeBet,
    isPending: isBetPending,
    isConfirming: isBetConfirming,
    isSuccess: isBetSuccess,
    error: betError,
    reset: resetBet,
  } = usePlaceBet();

  // After approval succeeds, refetch all on-chain data then reset
  useEffect(() => {
    if (isApproveSuccess) {
      toast.success("USDC approved");
      queryClient.invalidateQueries().then(() => resetApprove());
    }
  }, [isApproveSuccess, queryClient, resetApprove]);

  // After bet succeeds, reset form and refetch all on-chain data
  useEffect(() => {
    if (isBetSuccess) {
      toast.success("Bet placed successfully");
      setAmount("");
      queryClient.invalidateQueries();
      resetBet();
    }
  }, [isBetSuccess, resetBet, queryClient]);

  // Handle errors
  useEffect(() => {
    if (approveError) {
      toast.error("Approval failed", { description: approveError.message.split("\n")[0] });
      resetApprove();
    }
  }, [approveError, resetApprove]);

  useEffect(() => {
    if (betError) {
      toast.error("Bet failed", { description: betError.message.split("\n")[0] });
      resetBet();
    }
  }, [betError, resetBet]);

  if (!isConnected) {
    return <ConnectWalletPrompt message="Connect your wallet to place a bet" />;
  }

  if (!isOpen) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
          Betting is closed for this market
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-mono uppercase tracking-widest">Place a Bet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Side toggle */}
        <div className="grid grid-cols-2 gap-px bg-border">
          <Button
            variant={side === BetSide.Yes ? "default" : "ghost"}
            className={cn(
              "font-mono text-xs uppercase tracking-widest transition-all duration-200 ease-out",
              side === BetSide.Yes && "bg-foreground text-background font-bold"
            )}
            onClick={() => setSide(BetSide.Yes)}
          >
            YES
          </Button>
          <Button
            variant={side === BetSide.No ? "default" : "ghost"}
            className={cn(
              "font-mono text-xs uppercase tracking-widest transition-all duration-200 ease-out",
              side === BetSide.No && "bg-foreground text-background font-bold"
            )}
            onClick={() => setSide(BetSide.No)}
          >
            NO
          </Button>
        </div>

        {/* Amount input */}
        <USDCAmountInput value={amount} onChange={setAmount} balance={balance} />

        {/* Potential payout */}
        {payout !== undefined && parsedAmount > 0n && (
          <div className="border border-border p-3 animate-slide-up">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-muted-foreground uppercase tracking-widest">Potential payout</span>
              <span className="text-foreground font-bold">${formatUSDC(payout)}</span>
            </div>
          </div>
        )}

        {/* Action button */}
        {needsApproval && !isApproveSuccess ? (
          <TransactionButton
            onClick={() => approve()}
            isPending={isApprovePending}
            isConfirming={isApproveConfirming}
            disabled={parsedAmount === 0n}
            className="w-full"
            pendingText="Approving USDC..."
            confirmingText="Confirming approval..."
          >
            Approve USDC
          </TransactionButton>
        ) : (
          <TransactionButton
            onClick={() => placeBet(marketId, side, parsedAmount)}
            isPending={isBetPending}
            isConfirming={isBetConfirming}
            disabled={parsedAmount === 0n}
            className="w-full"
            pendingText="Confirm in wallet..."
            confirmingText="Placing bet..."
          >
            Place {side === BetSide.Yes ? "YES" : "NO"} Bet
          </TransactionButton>
        )}
      </CardContent>
    </Card>
  );
}
