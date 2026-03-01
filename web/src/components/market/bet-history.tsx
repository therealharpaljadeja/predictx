"use client";

import { useBetHistory } from "@/hooks/use-bet-history";
import { formatUSDC } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

const EXPLORER = "https://sepolia.basescan.org";

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function relativeTime(timestamp: bigint): string {
  const seconds = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function BetHistory({ marketId }: { marketId: number }) {
  const { data: bets, isLoading } = useBetHistory(marketId);

  return (
    <div className="border-x border-b border-[#333] p-6 space-y-4">
      <h2 className="text-sm font-mono uppercase tracking-widest font-semibold">Recent Bets</h2>

      {isLoading ? (
        <p className="text-xs font-mono text-muted-foreground">Loading...</p>
      ) : !bets || bets.length === 0 ? (
        <p className="text-xs font-mono text-muted-foreground">No bets yet</p>
      ) : (
        <div className="space-y-3">
          {bets.map((bet) => (
            <div key={bet.transactionHash} className="flex items-center justify-between gap-2 text-[13px] font-mono">
              <div className="flex items-center gap-2 min-w-0">
                <a
                  href={`${EXPLORER}/address/${bet.user}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors shrink-0"
                >
                  {truncateAddress(bet.user)}
                </a>
                <Badge variant={bet.side === 0 ? "default" : "secondary"} className="text-[10px] shrink-0">
                  {bet.side === 0 ? "YES" : "NO"}
                </Badge>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-bold">${formatUSDC(bet.amount)}</span>
                <span className="text-muted-foreground text-xs">{relativeTime(bet.timestamp)}</span>
                <a
                  href={`${EXPLORER}/tx/${bet.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
