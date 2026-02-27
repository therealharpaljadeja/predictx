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
import { MetricChart } from "@/components/market/metric-chart";
import { usePool, usePosition } from "@/hooks/use-pool";
import { useResolution } from "@/hooks/use-resolution";
import { MarketStatus } from "@/types/market";
import { useProfileImage } from "@/hooks/use-profile-image";
import { formatCompactNumber, formatUSDC, calculateOdds, getMarketTypeLabel, formatOperator, getVerificationUrl } from "@/lib/utils";
import { Target, Calendar, Clock, Loader2, User, ExternalLink } from "lucide-react";
import Image from "next/image";

export default function MarketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const marketId = parseInt(id);
  const { address } = useAccount();

  const { data: market, isLoading } = useMarket(marketId);
  const { data: pool } = usePool(marketId);
  const { data: position } = usePosition(marketId, address);
  const { data: resolution } = useResolution(marketId);
  const { data: profile } = useProfileImage(market?.endpointPath ?? "");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!market || market.createdAt === 0) {
    return <div className="text-center py-20 text-muted-foreground font-mono text-xs uppercase tracking-widest">Market not found</div>;
  }

  const totalYes = pool?.totalYesAmount ?? 0n;
  const totalNo = pool?.totalNoAmount ?? 0n;
  const odds = calculateOdds(totalYes, totalNo);
  const isOpen = market.status === MarketStatus.Open && market.bettingDeadline > Date.now() / 1000;
  const typeLabel = getMarketTypeLabel(market.endpointPath, market.jsonPath);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Market Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
            {profile?.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt={profile.username ?? ""}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">{market.description}</h1>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{typeLabel}</p>
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
            {MarketStatus[market.status].toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Chart — full width at top */}
      <MetricChart
        marketId={marketId}
        targetValue={market.targetValue}
        metricLabel={typeLabel}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Market Stats */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-mono uppercase tracking-widest">Market Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <Target className="h-3 w-3" /> Target
                  </div>
                  <p className="text-lg font-mono font-bold">{formatOperator(market.operator)} {formatCompactNumber(market.targetValue)}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <Clock className="h-3 w-3" /> Deadline
                  </div>
                  <CountdownTimer timestamp={market.bettingDeadline} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    <Calendar className="h-3 w-3" /> Resolution
                  </div>
                  <p className="text-[13px] font-mono">{new Date(market.resolutionDate * 1000).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Total Pool</div>
                  <p className="text-lg font-mono font-bold">${formatUSDC(totalYes + totalNo)}</p>
                </div>
              </div>

              {(() => {
                const link = getVerificationUrl(market.endpointPath);
                if (!link) return null;
                const isTweet = market.endpointPath.includes("tweets/");
                return (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                      <ExternalLink className="h-3 w-3" /> Source
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] font-mono text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
                    >
                      {isTweet ? "View Tweet" : link.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                );
              })()}

              <Separator />

              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Current Odds</p>
                <OddsBar yesPercent={odds.yes} noPercent={odds.no} />
              </div>

              <PoolBar totalYes={totalYes} totalNo={totalNo} />
            </CardContent>
          </Card>

          {/* Resolution result */}
          {market.status === MarketStatus.Resolved && resolution && resolution.resolvedAt > 0 && (() => {
            const verification = getVerificationUrl(market.endpointPath);
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-mono uppercase tracking-widest">Resolution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-[13px] font-mono">
                    <span className="text-muted-foreground">Actual Value</span>
                    <span className="font-bold">{formatCompactNumber(resolution.actualValue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-mono text-muted-foreground">Target Met?</span>
                    <Badge variant={resolution.targetMet ? "default" : "secondary"}>
                      {resolution.targetMet ? "YES" : "NO"}
                    </Badge>
                  </div>
                  {verification && (
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[13px] font-mono text-muted-foreground">Verify</span>
                      <a
                        href={verification.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[13px] font-mono text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
                      >
                        {verification.label}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </div>

        {/* Right: Bet Panel / Claim + User Position */}
        <div className="lg:col-span-2 space-y-6">
          {(market.status === MarketStatus.Resolved || market.status === MarketStatus.Cancelled) ? (
            <ClaimWinnings marketId={marketId} status={market.status} />
          ) : (
            <BetPanel marketId={marketId} isOpen={isOpen} />
          )}

          {/* User position */}
          {position && (position.yesAmount > 0n || position.noAmount > 0n) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-mono uppercase tracking-widest">Your Position</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6">
                  {position.yesAmount > 0n && (
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">YES</p>
                      <p className="text-lg font-mono font-bold">${formatUSDC(position.yesAmount)}</p>
                    </div>
                  )}
                  {position.noAmount > 0n && (
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">NO</p>
                      <p className="text-lg font-mono font-bold text-muted-foreground">${formatUSDC(position.noAmount)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
