"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
