"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface TransactionButtonProps {
  onClick: () => void;
  isPending: boolean;
  isConfirming: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  pendingText?: string;
  confirmingText?: string;
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

export function TransactionButton({
  onClick,
  isPending,
  isConfirming,
  disabled,
  children,
  pendingText = "Confirm in wallet...",
  confirmingText = "Confirming...",
  variant = "default",
  className,
}: TransactionButtonProps) {
  const isLoading = isPending || isConfirming;

  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      variant={variant}
      className={cn(
        "active:scale-[0.97] active:duration-100 transition-all duration-200",
        isLoading && "animate-pulse",
        className,
      )}
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isPending ? pendingText : isConfirming ? confirmingText : children}
    </Button>
  );
}
