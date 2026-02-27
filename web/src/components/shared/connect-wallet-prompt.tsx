"use client";

import { useAppKit } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export function ConnectWalletPrompt({ message = "Connect your wallet to continue" }: { message?: string }) {
  const { open } = useAppKit();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 border border-border">
      <Wallet className="h-8 w-8 text-muted-foreground" />
      <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest">{message}</p>
      <Button onClick={() => open()} className="gap-2">
        <Wallet className="h-3.5 w-3.5" />
        Connect Wallet
      </Button>
    </div>
  );
}
