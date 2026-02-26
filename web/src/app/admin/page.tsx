"use client";

import { useAccount } from "wagmi";
import { ConnectWalletPrompt } from "@/components/shared/connect-wallet-prompt";
import { CreateMarketForm } from "@/components/admin/create-market-form";
import { MarketManagement } from "@/components/admin/market-management";

export default function AdminPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return <ConnectWalletPrompt message="Connect your wallet to access admin panel" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground">Create and manage prediction markets</p>
      </div>
      <CreateMarketForm />
      <MarketManagement />
    </div>
  );
}
