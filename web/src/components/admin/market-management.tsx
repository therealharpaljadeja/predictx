"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TransactionButton } from "@/components/shared/transaction-button";
import { useMarkets } from "@/hooks/use-markets";
import { useRequestSettlement } from "@/hooks/use-admin";
import { MarketStatus } from "@/types/market";
import { formatCompactNumber, getMarketTypeLabel, formatOperator } from "@/lib/utils";

export function MarketManagement() {
  const { data: markets } = useMarkets();
  const { requestSettlement, isPending, isConfirming } = useRequestSettlement();

  if (!markets.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No markets created yet
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {markets.map((market) => (
            <div
              key={market.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{getMarketTypeLabel(market.endpointPath, market.jsonPath)}</span>
                  <Badge variant="outline" className="text-xs">
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
                    {MarketStatus[market.status]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
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
