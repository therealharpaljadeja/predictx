"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
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
  const { address, isConnected } = useAccount();
  const [side, setSide] = useState<BetSide>(BetSide.Yes);
  const [amount, setAmount] = useState("");

  const parsedAmount = parseUSDC(amount);

  const { data: allowance, refetch: refetchAllowance } = useUSDCAllowance(address);
  const { data: balance } = useUSDCBalance(address);
  const { data: payout } = usePotentialPayout(marketId, side, parsedAmount);

  const needsApproval = allowance !== undefined && parsedAmount > 0n && allowance < parsedAmount;

  const {
    approve,
    isPending: isApprovePending,
    isConfirming: isApproveConfirming,
    isSuccess: isApproveSuccess,
    reset: resetApprove,
  } = useApproveUSDC();

  const {
    placeBet,
    isPending: isBetPending,
    isConfirming: isBetConfirming,
    isSuccess: isBetSuccess,
    reset: resetBet,
  } = usePlaceBet();

  // After approval succeeds, refetch allowance
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
      resetApprove();
    }
  }, [isApproveSuccess, refetchAllowance, resetApprove]);

  // After bet succeeds, reset form
  useEffect(() => {
    if (isBetSuccess) {
      setAmount("");
      resetBet();
    }
  }, [isBetSuccess, resetBet]);

  if (!isConnected) {
    return <ConnectWalletPrompt message="Connect your wallet to place a bet" />;
  }

  if (!isOpen) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Betting is closed for this market
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Place a Bet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Side toggle */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={side === BetSide.Yes ? "default" : "outline"}
            className={cn(
              side === BetSide.Yes && "bg-emerald-600 hover:bg-emerald-700"
            )}
            onClick={() => setSide(BetSide.Yes)}
          >
            YES
          </Button>
          <Button
            variant={side === BetSide.No ? "default" : "outline"}
            className={cn(
              side === BetSide.No && "bg-red-600 hover:bg-red-700"
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
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Potential payout</span>
              <span className="font-medium text-emerald-400">${formatUSDC(payout)}</span>
            </div>
          </div>
        )}

        {/* Action button */}
        {needsApproval ? (
          <TransactionButton
            onClick={() => approve(parsedAmount)}
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
