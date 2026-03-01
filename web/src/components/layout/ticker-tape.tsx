"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTickerFeed, type TickerItem } from "@/hooks/use-ticker-feed";

const PX_PER_SECOND = 50;

function Marquee({
  items,
  visible,
  onCycleComplete,
}: {
  items: TickerItem[];
  visible: boolean;
  onCycleComplete?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(30);

  // Measure one half's width and compute duration for consistent speed
  useEffect(() => {
    if (!ref.current) return;
    const halfWidth = ref.current.scrollWidth / 2;
    setDuration(Math.max(halfWidth / PX_PER_SECOND, 5));
  }, [items]);

  if (items.length === 0) return null;

  const content = items.map((item, i) => (
    <Link
      key={i}
      href={`/market/${item.marketId}`}
      className="shrink-0 px-4 text-muted-foreground transition-colors hover:text-foreground"
    >
      {item.text}
    </Link>
  ));

  return (
    <div
      ref={ref}
      className={`absolute inset-0 flex w-max items-center transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{
        animation: `ticker-scroll ${duration}s linear infinite`,
      }}
      onAnimationIteration={visible ? onCycleComplete : undefined}
    >
      <div className="flex shrink-0 items-center">{content}</div>
      <div className="flex shrink-0 items-center">{content}</div>
    </div>
  );
}

export function TickerTape() {
  const { data } = useTickerFeed();
  const [mode, setMode] = useState<"bets" | "metrics">("bets");

  const handleCycleComplete = useCallback(() => {
    setMode((prev) => (prev === "bets" ? "metrics" : "bets"));
  }, []);

  const bets = data?.bets ?? [];
  const metrics = data?.metrics ?? [];

  if (bets.length === 0 && metrics.length === 0) return null;

  return (
    <div className="flex border-b border-border bg-background font-mono text-[11px] uppercase tracking-widest">
      {/* Fixed label — slides based on mode state */}
      <div className="border-r border-border px-4 overflow-hidden h-8">
        <div
          className="transition-transform duration-500 ease-in-out"
          style={{ transform: mode === "bets" ? "translateY(0)" : "translateY(-50%)" }}
        >
          <div className="flex h-8 items-center font-bold text-foreground">
            BETS
          </div>
          <div className="flex h-8 items-center font-bold text-foreground">
            MARKETS
          </div>
        </div>
      </div>

      {/* Scrolling content — both always mounted so scroll position is preserved */}
      <div className="relative flex-1 overflow-hidden h-8">
        <Marquee items={bets} visible={mode === "bets"} onCycleComplete={handleCycleComplete} />
        <Marquee items={metrics} visible={mode === "metrics"} onCycleComplete={handleCycleComplete} />
      </div>
    </div>
  );
}
