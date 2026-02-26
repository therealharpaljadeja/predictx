"use client";

import { useAccount, useReadContracts } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConnectWalletPrompt } from "@/components/shared/connect-wallet-prompt";
import { TransactionButton } from "@/components/shared/transaction-button";
import { useMarkets } from "@/hooks/use-markets";
import { useClaimWinnings } from "@/hooks/use-claim-winnings";
import { BettingPoolABI, MarketResolutionABI } from "@/lib/abis";
import { CONTRACTS } from "@/lib/contracts";
import { MarketStatus } from "@/types/market";
import { formatUSDC, getMarketTypeLabel } from "@/lib/utils";
import Link from "next/link";

export function UserBetsTable() {
  const { address, isConnected } = useAccount();
  const { data: markets } = useMarkets();

  // Read positions for all markets
  const positionContracts = markets.map((m) => ({
    address: CONTRACTS.BettingPool,
    abi: BettingPoolABI,
    functionName: "getPosition" as const,
    args: [BigInt(m.id), address!] as const,
  }));

  const { data: positions } = useReadContracts({
    contracts: positionContracts,
    query: { enabled: isConnected && markets.length > 0 },
  });

  const { claim, isPending, isConfirming } = useClaimWinnings();

  if (!isConnected) {
    return <ConnectWalletPrompt message="Connect your wallet to view your bets" />;
  }

  // Filter to only markets where user has a position
  const userBets = markets
    .map((market, i) => {
      const pos = positions?.[i];
      if (pos?.status !== "success" || !pos.result) return null;
      const { yesAmount, noAmount, claimed, refunded } = pos.result;
      if (yesAmount === 0n && noAmount === 0n) return null;
      return { market, position: { yesAmount, noAmount, claimed, refunded } };
    })
    .filter(Boolean) as Array<{
    market: (typeof markets)[0];
    position: { yesAmount: bigint; noAmount: bigint; claimed: boolean; refunded: boolean };
  }>;

  if (userBets.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No bets placed yet. <Link href="/" className="text-indigo-400 hover:underline">Browse markets</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Bets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {userBets.map(({ market, position }) => {
            const totalBet = position.yesAmount + position.noAmount;
            const statusLabel =
              market.status === MarketStatus.Resolved
                ? position.claimed
                  ? "Claimed"
                  : "Claimable"
                : market.status === MarketStatus.Cancelled
                ? position.refunded
                  ? "Refunded"
                  : "Refundable"
                : "Active";

            return (
              <Link
                key={market.id}
                href={`/market/${market.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:border-indigo-500/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{getMarketTypeLabel(market.endpointPath, market.jsonPath)}</span>
                    <Badge variant="outline" className="text-xs">#{market.id}</Badge>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {position.yesAmount > 0n && (
                      <span className="text-emerald-400">YES: ${formatUSDC(position.yesAmount)}</span>
                    )}
                    {position.noAmount > 0n && (
                      <span className="text-red-400">NO: ${formatUSDC(position.noAmount)}</span>
                    )}
                    <span>Total: ${formatUSDC(totalBet)}</span>
                  </div>
                </div>
                <Badge
                  variant={
                    statusLabel === "Active"
                      ? "default"
                      : statusLabel === "Claimable" || statusLabel === "Refundable"
                      ? "outline"
                      : "secondary"
                  }
                >
                  {statusLabel}
                </Badge>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
