"use client";

import { useAccount, useReadContracts } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConnectWalletPrompt } from "@/components/shared/connect-wallet-prompt";
import { useMarkets } from "@/hooks/use-markets";
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

  // Read resolutions for resolved markets
  const resolutionContracts = markets.map((m) => ({
    address: CONTRACTS.MarketResolution,
    abi: MarketResolutionABI,
    functionName: "getResolution" as const,
    args: [BigInt(m.id)] as const,
  }));

  const { data: resolutions } = useReadContracts({
    contracts: resolutionContracts,
    query: { enabled: markets.length > 0 },
  });

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

      const res = resolutions?.[i];
      const resolution = res?.status === "success" && res.result ? res.result : null;

      return { market, position: { yesAmount, noAmount, claimed, refunded }, resolution };
    })
    .filter(Boolean)
    .reverse() as Array<{
    market: (typeof markets)[0];
    position: { yesAmount: bigint; noAmount: bigint; claimed: boolean; refunded: boolean };
    resolution: { targetMet: boolean; resolvedAt: bigint } | null;
  }>;

  if (userBets.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground font-mono text-xs">
          No bets placed yet. <Link href="/" className="text-foreground hover:underline">Browse markets</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="px-0">
        <div className="space-y-0 divide-y divide-border">
          {userBets.map(({ market, position, resolution }, i) => {
            const totalBet = position.yesAmount + position.noAmount;

            // Determine win/loss for resolved markets
            let isWin = false;
            let isLoss = false;
            if (market.status === MarketStatus.Resolved && resolution && Number(resolution.resolvedAt) > 0) {
              const targetMet = resolution.targetMet;
              const userWinningBet = targetMet ? position.yesAmount : position.noAmount;
              isWin = userWinningBet > 0n;
              isLoss = userWinningBet === 0n;
            }

            const statusLabel =
              market.status === MarketStatus.Resolved
                ? position.claimed
                  ? "CLAIMED"
                  : isLoss
                  ? "LOST"
                  : "CLAIMABLE"
                : market.status === MarketStatus.Cancelled
                ? position.refunded
                  ? "REFUNDED"
                  : "REFUNDABLE"
                : "ACTIVE";

            const badgeVariant =
              statusLabel === "ACTIVE"
                ? "default" as const
                : statusLabel === "CLAIMABLE" || statusLabel === "REFUNDABLE"
                ? "outline" as const
                : statusLabel === "LOST"
                ? "destructive" as const
                : "secondary" as const;

            return (
              <Link
                key={market.id}
                href={`/market/${market.id}`}
                className="flex items-center justify-between border-border px-6 py-3 hover:bg-[#141414] transition-colors duration-150 block animate-card-enter"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{market.description}</span>
                    <Badge variant="outline" className="text-[10px]">#{market.id}</Badge>
                  </div>
                  <div className="flex gap-3 text-[11px] font-mono text-muted-foreground">
                    {position.yesAmount > 0n && (
                      <span className={isWin && resolution?.targetMet ? "text-foreground" : ""}>
                        YES: ${formatUSDC(position.yesAmount)}
                      </span>
                    )}
                    {position.noAmount > 0n && (
                      <span className={isWin && !resolution?.targetMet ? "text-foreground" : ""}>
                        NO: ${formatUSDC(position.noAmount)}
                      </span>
                    )}
                    <span>Total: ${formatUSDC(totalBet)}</span>
                  </div>
                </div>
                <Badge
                  variant={badgeVariant}
                  className={(statusLabel === "CLAIMABLE" || statusLabel === "REFUNDABLE") ? "animate-badge-glow" : ""}
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
