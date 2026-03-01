"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface USDCAmountInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  balance?: bigint;
}

export function USDCAmountInput({ value, onChange, label = "Amount (USDC)", balance }: USDCAmountInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {balance !== undefined && (
          <button
            type="button"
            className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-150"
            onClick={() => onChange((Number(balance) / 1e6).toString())}
          >
            Bal: {(Number(balance) / 1e6).toFixed(2)}
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-px bg-border">
        {[1, 2, 5, 10].map((amount) => (
          <Button
            key={amount}
            type="button"
            variant={value === amount.toString() ? "default" : "ghost"}
            className={cn(
              "font-mono text-xs uppercase tracking-widest transition-all duration-200 ease-out",
              value === amount.toString() && "bg-foreground text-background font-bold"
            )}
            onClick={() => onChange(amount.toString())}
          >
            {amount}
          </Button>
        ))}
      </div>
      <Input
        type="number"
        min="0"
        step="0.01"
        placeholder="0.00"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
