"use client";

import { useCountdown } from "@/hooks/use-countdown";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  timestamp: number;
  label?: string;
  className?: string;
}

export function CountdownTimer({ timestamp, label, className }: CountdownTimerProps) {
  const { days, hours, minutes, seconds, expired } = useCountdown(timestamp);

  if (expired) {
    return <span className={cn("text-muted-foreground font-mono text-[11px]", className)}>Expired</span>;
  }

  const isUrgent = days === 0 && hours === 0;

  return (
    <div className={cn(
      "flex items-center gap-1 font-mono text-[11px]",
      isUrgent && "animate-urgency",
      className,
    )}>
      {label && <span className="text-muted-foreground mr-1">{label}</span>}
      {days > 0 && <TimeUnit value={days} unit="d" />}
      <TimeUnit value={hours} unit="h" />
      <TimeUnit value={minutes} unit="m" />
      {days === 0 && <TimeUnit value={seconds} unit="s" />}
    </div>
  );
}

function TimeUnit({ value, unit }: { value: number; unit: string }) {
  return (
    <span>
      <span className="text-foreground">{value.toString().padStart(2, "0")}</span>
      <span className="text-muted-foreground text-[10px]">{unit}</span>
    </span>
  );
}
