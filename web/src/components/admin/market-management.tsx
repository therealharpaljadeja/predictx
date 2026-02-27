"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransactionButton } from "@/components/shared/transaction-button";
import { useMarkets } from "@/hooks/use-markets";
import { useRequestSettlement } from "@/hooks/use-admin";
import { MarketStatus } from "@/types/market";
import { formatCompactNumber, getMarketTypeLabel, formatOperator } from "@/lib/utils";

export function MarketManagement() {
  const { data: markets } = useMarkets();
  const { requestSettlement, isPending, isConfirming, isSuccess, error, reset } = useRequestSettlement();

  useEffect(() => {
    if (isSuccess) {
      toast.success("Settlement requested");
      reset();
    }
  }, [isSuccess, reset]);

  useEffect(() => {
    if (error) {
      toast.error("Settlement failed", { description: error.message.split("\n")[0] });
      reset();
    }
  }, [error, reset]);

  if (!markets.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground font-mono text-xs uppercase tracking-widest">
          No markets created yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-mono uppercase tracking-widest">Market Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0 divide-y divide-border">
          {markets.map((market) => (
            <div
              key={market.id}
              className="flex items-center justify-between p-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{getMarketTypeLabel(market.endpointPath, market.jsonPath)}</span>
                  <Badge variant="outline" className="text-[10px]">
                    #{market.id}
                  </Badge>
                  <Badge
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
                <p className="text-[11px] font-mono text-muted-foreground">
                  Target: {formatOperator(market.operator)} {formatCompactNumber(market.targetValue)}
                </p>
              </div>
              {market.status !== MarketStatus.Resolved &&
                market.status !== MarketStatus.Cancelled && (
                  <TransactionButton
                    onClick={() => requestSettlement(market.id)}
                    isPending={isPending}
                    isConfirming={isConfirming}
                    variant="outline"
                  >
                    Resolve
                  </TransactionButton>
                )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
