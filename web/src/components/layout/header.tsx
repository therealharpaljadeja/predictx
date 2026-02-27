"use client";

import Link from "next/link";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { ADMIN_WALLET } from "@/lib/contracts";
import { TrendingUp, Wallet } from "lucide-react";

export function Header() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();

  return (
    <header className="border-b border-border bg-[#0A0A0A]">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-sm uppercase tracking-widest">
            <TrendingUp className="h-4 w-4" />
            <span>PredictX</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-xs font-mono uppercase tracking-widest">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors duration-150">
              Markets
            </Link>
            <Link href="/my-bets" className="text-muted-foreground hover:text-foreground transition-colors duration-150">
              My Bets
            </Link>
            {isConnected && address?.toLowerCase() === ADMIN_WALLET.toLowerCase() && (
              <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors duration-150">
                Admin
              </Link>
            )}
          </nav>
        </div>
        <Button variant="outline" onClick={() => open()} className="gap-2 font-mono text-xs">
          <Wallet className="h-3.5 w-3.5" />
          {isConnected
            ? `${address!.slice(0, 6)}...${address!.slice(-4)}`
            : "Connect Wallet"}
        </Button>
      </div>
    </header>
  );
}
