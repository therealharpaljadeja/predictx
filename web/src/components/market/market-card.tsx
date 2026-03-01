"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OddsBar } from "./odds-bar";
import { CountdownTimer } from "./countdown-timer";
import { usePool } from "@/hooks/use-pool";
import { useProfileImage } from "@/hooks/use-profile-image";
import { Market, MarketStatus } from "@/types/market";
import { calculateOdds, formatCompactNumber, formatUSDC, getMarketTypeLabel, formatOperator } from "@/lib/utils";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Target, DollarSign, User } from "lucide-react";

const statusConfig: Record<MarketStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  [MarketStatus.Open]: { label: "LIVE", variant: "default" },
  [MarketStatus.Closed]: { label: "CLOSED", variant: "secondary" },
  [MarketStatus.Resolved]: { label: "RESOLVED", variant: "outline" },
  [MarketStatus.Cancelled]: { label: "CANCELLED", variant: "destructive" },
};

export function MarketCard({ market }: { market: Market }) {
  const { data: pool } = usePool(market.id);
  const { data: profile } = useProfileImage(market.endpointPath);
  const totalYes = pool?.totalYesAmount ?? 0n;
  const totalNo = pool?.totalNoAmount ?? 0n;
  const odds = calculateOdds(totalYes, totalNo);
  const total = totalYes + totalNo;
  const config = statusConfig[market.status];
  const typeLabel = getMarketTypeLabel(market.endpointPath, market.jsonPath);

  return (
    <Link href={`/market/${market.id}`}>
      <Card className="cursor-pointer h-full transition-all duration-200 ease-out hover:border-[#333333] hover:-translate-y-1 hover:shadow-[0_4px_12px_rgba(255,255,255,0.04)] active:scale-[0.98] active:duration-100">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {!market.endpointPath.includes("tweets/counts/") && (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
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
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              )}
              <div>
                <p className="font-bold text-sm">{market.description}</p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{typeLabel}</p>
              </div>
            </div>
            <Badge variant={config.variant} className={`shrink-0 ${config.label === "LIVE" ? "animate-status-pulse" : ""}`}>
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 cursor-help">
                  <Target className="h-3 w-3" />
                  {formatOperator(market.operator)} {formatCompactNumber(market.targetValue)}
                </span>
              </TooltipTrigger>
              <TooltipContent>Target value to resolve YES</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 cursor-help">
                  <DollarSign className="h-3 w-3" />
                  ${formatUSDC(total)}
                </span>
              </TooltipTrigger>
              <TooltipContent>Total pool (USDC)</TooltipContent>
            </Tooltip>
          </div>

          <OddsBar yesPercent={odds.yes} noPercent={odds.no} />

          {market.status === MarketStatus.Open && (
            <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <CountdownTimer timestamp={market.bettingDeadline} label="Closes:" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
