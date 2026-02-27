"use client";

import { formatUSDC } from "@/lib/utils";

interface PoolBarProps {
  totalYes: bigint;
  totalNo: bigint;
}

export function PoolBar({ totalYes, totalNo }: PoolBarProps) {
  const total = totalYes + totalNo;
  const yesPct = total > 0n ? Number((totalYes * 100n) / total) : 50;
  const noPct = total > 0n ? 100 - yesPct : 50;

  return (
    <div className="space-y-2">
      <div className="flex h-6 w-full overflow-hidden border border-border">
        <div
          className="flex items-center justify-center bg-[#141414] text-foreground text-[10px] font-mono uppercase tracking-widest transition-all duration-700 ease-out"
          style={{ width: `${Math.max(yesPct, 10)}%` }}
        >
          YES
        </div>
        <div
          className="flex items-center justify-center bg-[#0A0A0A] text-muted-foreground text-[10px] font-mono uppercase tracking-widest transition-all duration-700 ease-out border-l border-border"
          style={{ width: `${Math.max(noPct, 10)}%` }}
        >
          NO
        </div>
      </div>
      <div className="flex justify-between text-[11px] font-mono">
        <span className="text-foreground">${formatUSDC(totalYes)}</span>
        <span className="text-muted-foreground">Total: ${formatUSDC(total)}</span>
        <span className="text-muted-foreground">${formatUSDC(totalNo)}</span>
      </div>
    </div>
  );
}
