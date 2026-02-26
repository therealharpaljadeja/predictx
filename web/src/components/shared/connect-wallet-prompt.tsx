"use client";

import { useAppKit } from "@reown/appkit/react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

export function ConnectWalletPrompt({ message = "Connect your wallet to continue" }: { message?: string }) {
  const { open } = useAppKit();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <Wallet className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground">{message}</p>
      <Button onClick={() => open()} className="gap-2">
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    </div>
  );
}
