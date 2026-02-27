"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectWalletPrompt } from "@/components/shared/connect-wallet-prompt";
import { CreateMarketForm } from "@/components/admin/create-market-form";
import { MarketManagement } from "@/components/admin/market-management";
import { ADMIN_WALLET } from "@/lib/contracts";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const isAdmin = isConnected && address?.toLowerCase() === ADMIN_WALLET.toLowerCase();

  useEffect(() => {
    if (isConnected && !isAdmin) {
      router.replace("/");
    }
  }, [isConnected, isAdmin, router]);

  if (!isConnected) {
    return <ConnectWalletPrompt message="Connect your wallet to access admin panel" />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Create and manage prediction markets</p>
      </div>
      <CreateMarketForm />
      <MarketManagement />
    </div>
  );
}
