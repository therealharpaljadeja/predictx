"use client";

import { UserBetsTable } from "@/components/bets/user-bets-table";

export default function MyBetsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Bets</h1>
        <p className="text-muted-foreground">Track your positions across all markets</p>
      </div>
      <UserBetsTable />
    </div>
  );
}
