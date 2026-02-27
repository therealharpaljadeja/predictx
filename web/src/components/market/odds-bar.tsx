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
      <div className="flex h-1 w-full overflow-hidden bg-[#1C1C1C]">
        <div
          className="bg-foreground transition-all duration-500 ease-out"
          style={{ width: `${yesPercent}%` }}
        />
        <div
          className="bg-[#333333] transition-all duration-500 ease-out"
          style={{ width: `${noPercent}%` }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between text-[11px] font-mono">
          <span className="text-foreground">YES {yesPercent}%</span>
          <span className="text-muted-foreground">NO {noPercent}%</span>
        </div>
      )}
    </div>
  );
}
