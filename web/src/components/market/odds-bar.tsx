"use client";

import { cn } from "@/lib/utils";

interface OddsBarProps {
  yesPercent: number;
  noPercent: number;
  className?: string;
  showLabels?: boolean;
}

export function OddsBar({ yesPercent, noPercent, className, showLabels = true }: OddsBarProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex h-2 w-full overflow-hidden bg-[#1C1C1C] border border-border">
        <div
          className="bg-foreground transition-all duration-500 ease-out"
          style={{ width: `${yesPercent}%` }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between text-[11px] font-mono">
          <span className="text-foreground font-bold">YES {yesPercent}%</span>
          <span className="text-muted-foreground">NO {noPercent}%</span>
        </div>
      )}
    </div>
  );
}
