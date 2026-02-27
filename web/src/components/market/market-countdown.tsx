"use client";

import { useCountdown } from "@/hooks/use-countdown";
import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MarketCountdownProps {
  timestamp: number;
  label?: string;
}

function FlipDigit({ value }: { value: string }) {
  const [display, setDisplay] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (value !== prevRef.current) {
      setFlipping(true);
      const timer = setTimeout(() => {
        setDisplay(value);
        setFlipping(false);
      }, 150);
      prevRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <span
      className={cn(
        "inline-flex h-10 w-7 items-center justify-center bg-muted/60 text-xl font-mono font-bold text-foreground transition-all duration-150",
        flipping && "blur-[3px] scale-y-90 opacity-40",
      )}
    >
      {display}
    </span>
  );
}

function DigitPair({ value, label }: { value: number; label: string }) {
  const str = value.toString().padStart(2, "0");
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-[2px]">
        <FlipDigit value={str[0]} />
        <FlipDigit value={str[1]} />
      </div>
      <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <div className="flex flex-col items-center justify-center pb-4">
      <span className="text-lg font-mono text-muted-foreground/50">:</span>
    </div>
  );
}

export function MarketCountdown({ timestamp, label }: MarketCountdownProps) {
  const { days, hours, minutes, seconds, expired } = useCountdown(timestamp);

  if (expired) return null;

  const isUrgent = days === 0 && hours < 1;

  return (
    <div className={cn(
      "flex flex-col items-center gap-2 py-2",
      isUrgent && "animate-urgency",
    )}>
      {label && (
        <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
          {label}
        </span>
      )}
      <div className="flex items-center gap-2">
        {days > 0 && (
          <>
            <DigitPair value={days} label="days" />
            <Separator />
          </>
        )}
        <DigitPair value={hours} label="hrs" />
        <Separator />
        <DigitPair value={minutes} label="min" />
        <Separator />
        <DigitPair value={seconds} label="sec" />
      </div>
    </div>
  );
}
