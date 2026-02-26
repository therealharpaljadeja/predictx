"use client";

import { use } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BetPanel } from "@/components/market/bet-panel";
import { PoolBar } from "@/components/market/pool-bar";
import { CountdownTimer } from "@/components/market/countdown-timer";
import { ClaimWinnings } from "@/components/market/claim-winnings";
import { OddsBar } from "@/components/market/odds-bar";
import { useMarket } from "@/hooks/use-markets";
import { usePool, usePosition } from "@/hooks/use-pool";
import { useResolution } from "@/hooks/use-resolution";
import { MarketStatus } from "@/types/market";
import { formatCompactNumber, formatUSDC, calculateOdds, getMarketTypeLabel, formatOperator } from "@/lib/utils";
import { Target, Calendar, Clock, Loader2, BarChart3 } from "lucide-react";

export default function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const marketId = parseInt(id);
  const { address } = useAccount();

  const { data: market, isLoading } = useMarket(marketId);
  const { data: pool } = usePool(marketId);
  const { data: position } = usePosition(marketId, address);
  const { data: resolution } = useResolution(marketId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!market || market.createdAt === 0) {
    return <div className="text-center py-20 text-muted-foreground">Market not found</div>;
  }

  const totalYes = pool?.totalYesAmount ?? 0n;
  const totalNo = pool?.totalNoAmount ?? 0n;
  const odds = calculateOdds(totalYes, totalNo);
  const isOpen = market.status === MarketStatus.Open && market.bettingDeadline > Date.now() / 1000;
  const typeLabel = getMarketTypeLabel(market.endpointPath, market.jsonPath);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Market Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{typeLabel}</h1>
            <p className="text-muted-foreground">{market.description}</p>
          </div>
          <Badge
            className="ml-auto"
            variant={
              market.status === MarketStatus.Open
                ? "default"
                : market.status === MarketStatus.Resolved
                ? "outline"
                : "secondary"
            }
          >
            {MarketStatus[market.status]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Market Stats */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Market Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Target className="h-3.5 w-3.5" /> Target
                  </div>
                  <p className="text-lg font-semibold">{formatOperator(market.operator)} {formatCompactNumber(market.targetValue)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> Betting Deadline
                  </div>
                  <CountdownTimer timestamp={market.bettingDeadline} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> Resolution Date
                  </div>
                  <p className="text-sm">{new Date(market.resolutionDate * 1000).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Total Pool</div>
                  <p className="text-lg font-semibold">${formatUSDC(totalYes + totalNo)}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium">Current Odds</p>
                <OddsBar yesPercent={odds.yes} noPercent={odds.no} />
              </div>

              <PoolBar totalYes={totalYes} totalNo={totalNo} />
            </CardContent>
          </Card>

          {/* Resolution result */}
          {market.status === MarketStatus.Resolved && resolution && resolution.resolvedAt > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resolution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Actual Value</span>
                  <span className="font-semibold">{formatCompactNumber(resolution.actualValue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Met?</span>
                  <Badge variant={resolution.targetMet ? "default" : "destructive"}>
                    {resolution.targetMet ? "YES" : "NO"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* User position */}
          {position && (position.yesAmount > 0n || position.noAmount > 0n) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  {position.yesAmount > 0n && (
                    <div>
                      <p className="text-xs text-muted-foreground">YES</p>
                      <p className="text-lg font-semibold text-emerald-400">${formatUSDC(position.yesAmount)}</p>
                    </div>
                  )}
                  {position.noAmount > 0n && (
                    <div>
                      <p className="text-xs text-muted-foreground">NO</p>
                      <p className="text-lg font-semibold text-red-400">${formatUSDC(position.noAmount)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Bet Panel / Claim */}
        <div className="lg:col-span-2 space-y-6">
          {(market.status === MarketStatus.Resolved || market.status === MarketStatus.Cancelled) ? (
            <ClaimWinnings marketId={marketId} status={market.status} />
          ) : (
            <BetPanel marketId={marketId} isOpen={isOpen} />
          )}
        </div>
      </div>
    </div>
  );
}
