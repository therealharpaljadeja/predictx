"use client";

import Link from "next/link";
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { TrendingUp, Wallet } from "lucide-react";

export function Header() {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <TrendingUp className="h-6 w-6 text-indigo-500" />
            <span>PredictX</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Markets
            </Link>
            <Link href="/my-bets" className="text-muted-foreground hover:text-foreground transition-colors">
              My Bets
            </Link>
            <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </Link>
          </nav>
        </div>
        <Button variant="outline" onClick={() => open()} className="gap-2">
          <Wallet className="h-4 w-4" />
          {isConnected
            ? `${address!.slice(0, 6)}...${address!.slice(-4)}`
            : "Connect Wallet"}
        </Button>
      </div>
    </header>
  );
}
