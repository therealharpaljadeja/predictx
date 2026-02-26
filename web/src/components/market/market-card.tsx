"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OddsBar } from "./odds-bar";
import { CountdownTimer } from "./countdown-timer";
import { usePool } from "@/hooks/use-pool";
import { Market, MarketStatus } from "@/types/market";
import { calculateOdds, formatCompactNumber, formatUSDC, getMarketTypeLabel, formatOperator } from "@/lib/utils";
import { Target, DollarSign, BarChart3 } from "lucide-react";

const statusConfig: Record<MarketStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  [MarketStatus.Open]: { label: "Active", variant: "default" },
  [MarketStatus.Closed]: { label: "Closed", variant: "secondary" },
  [MarketStatus.Resolved]: { label: "Resolved", variant: "outline" },
  [MarketStatus.Cancelled]: { label: "Cancelled", variant: "destructive" },
};

export function MarketCard({ market }: { market: Market }) {
  const { data: pool } = usePool(market.id);
  const totalYes = pool?.totalYesAmount ?? 0n;
  const totalNo = pool?.totalNoAmount ?? 0n;
  const odds = calculateOdds(totalYes, totalNo);
  const total = totalYes + totalNo;
  const config = statusConfig[market.status];
  const typeLabel = getMarketTypeLabel(market.endpointPath, market.jsonPath);

  return (
    <Link href={`/market/${market.id}`}>
      <Card className="hover:border-indigo-500/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{typeLabel}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{market.description}</p>
              </div>
            </div>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              {formatOperator(market.operator)} {formatCompactNumber(market.targetValue)}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              ${formatUSDC(total)} pool
            </span>
          </div>

          <OddsBar yesPercent={odds.yes} noPercent={odds.no} />

          {market.status === MarketStatus.Open && (
            <div className="text-xs text-muted-foreground">
              <CountdownTimer timestamp={market.bettingDeadline} label="Betting closes:" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
