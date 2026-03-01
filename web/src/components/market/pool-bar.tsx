"use client";

import { formatUSDC, calculateOdds } from "@/lib/utils";

interface PoolBarProps {
  totalYes: bigint;
  totalNo: bigint;
}

export function PoolBar({ totalYes, totalNo }: PoolBarProps) {
  const total = totalYes + totalNo;
  const odds = calculateOdds(totalYes, totalNo);

  return (
    <div className="space-y-2">
      <div className="flex h-10 w-full overflow-hidden border border-border">
        <div
          className="flex items-center justify-center bg-foreground text-background text-xs font-mono font-bold uppercase tracking-widest transition-all duration-700 ease-out"
          style={{ width: `${Math.max(odds.yes, 15)}%` }}
        >
          YES {odds.yes}%
        </div>
        <div
          className="flex items-center justify-center bg-[#1C1C1C] text-muted-foreground text-xs font-mono uppercase tracking-widest transition-all duration-700 ease-out"
          style={{ width: `${Math.max(odds.no, 15)}%` }}
        >
          NO {odds.no}%
        </div>
      </div>
      <div className="flex justify-between text-[11px] font-mono">
        <span className="text-foreground font-bold">${formatUSDC(totalYes)}</span>
        <span className="text-muted-foreground">Total: ${formatUSDC(total)}</span>
        <span className="text-muted-foreground">${formatUSDC(totalNo)}</span>
      </div>
    </div>
  );
}
