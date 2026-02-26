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
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${yesPercent}%` }}
        />
        <div
          className="bg-red-500 transition-all duration-500 ease-out"
          style={{ width: `${noPercent}%` }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="text-emerald-500">YES {yesPercent}%</span>
          <span className="text-red-500">NO {noPercent}%</span>
        </div>
      )}
    </div>
  );
}
