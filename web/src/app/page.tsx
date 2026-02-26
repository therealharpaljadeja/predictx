"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketCard } from "@/components/market/market-card";
import { useMarkets } from "@/hooks/use-markets";
import { MarketStatus } from "@/types/market";
import { Loader2 } from "lucide-react";

type Filter = "all" | "active" | "resolved";

export default function HomePage() {
  const { data: markets, isLoading } = useMarkets();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = markets.filter((m) => {
    if (filter === "active") return m.status === MarketStatus.Open;
    if (filter === "resolved") return m.status === MarketStatus.Resolved;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prediction Markets</h1>
          <p className="text-muted-foreground">Bet on X/Twitter milestones</p>
        </div>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="resolved">Resolved</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No markets found
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
