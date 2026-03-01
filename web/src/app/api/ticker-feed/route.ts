import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { metricSnapshots } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { publicClient } from "@/lib/viem-client";
import { MarketRegistryABI } from "@/lib/abis";
import { CONTRACTS } from "@/lib/contracts";
import { USDC_DECIMALS } from "@/lib/contracts";

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL ?? "";

interface TickerItem {
  text: string;
  marketId: number;
}

const RECENT_BETS_QUERY = `
  query RecentBets {
    betPlaceds(
      orderBy: timestampParam
      orderDirection: desc
      first: 15
    ) {
      user
      side
      amount
      marketId
    }
  }
`;

interface SubgraphBet {
  user: string;
  side: string;
  amount: string;
  marketId: string;
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatUSDC(amount: string): string {
  const value = Number(BigInt(amount)) / 10 ** USDC_DECIMALS;
  return `$${value.toFixed(2)}`;
}

function formatMetricValue(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

function extractUsername(endpointPath: string): string | null {
  const match = endpointPath.match(/users\/by\/username\/([^?/]+)/);
  return match ? match[1] : null;
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "\u2026";
}

export async function GET() {
  try {
    // Fetch all three sources in parallel
    const [betsResult, metricsResult, marketCountResult] = await Promise.allSettled([
      // 1. Subgraph bets
      SUBGRAPH_URL
        ? fetch(SUBGRAPH_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: RECENT_BETS_QUERY }),
          }).then((r) => r.json())
        : Promise.resolve({ data: { betPlaceds: [] } }),

      // 2. DB metric snapshots — latest per (endpointPath, jsonPath)
      db
        .selectDistinctOn([metricSnapshots.endpointPath, metricSnapshots.jsonPath], {
          marketId: metricSnapshots.marketId,
          endpointPath: metricSnapshots.endpointPath,
          jsonPath: metricSnapshots.jsonPath,
          value: metricSnapshots.value,
        })
        .from(metricSnapshots)
        .orderBy(
          metricSnapshots.endpointPath,
          metricSnapshots.jsonPath,
          desc(metricSnapshots.timestamp),
        ),

      // 3. Market count for multicall
      publicClient.readContract({
        address: CONTRACTS.MarketRegistry,
        abi: MarketRegistryABI,
        functionName: "nextMarketId",
      }),
    ]);

    // Get market descriptions via multicall
    const marketCount =
      marketCountResult.status === "fulfilled" ? Number(marketCountResult.value) : 0;

    let descriptions: Map<number, string> = new Map();
    if (marketCount > 0) {
      const calls = Array.from({ length: marketCount }, (_, i) => ({
        address: CONTRACTS.MarketRegistry,
        abi: MarketRegistryABI,
        functionName: "getMarket" as const,
        args: [BigInt(i)] as const,
      }));

      const results = await publicClient.multicall({ contracts: calls });
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.status === "success" && r.result) {
          descriptions.set(i, r.result.description);
        }
      }
    }

    // Format bets
    const bets: TickerItem[] = [];
    if (betsResult.status === "fulfilled") {
      const rawBets: SubgraphBet[] = betsResult.value?.data?.betPlaceds ?? [];
      for (const b of rawBets) {
        const marketId = Number(b.marketId);
        const side = Number(b.side) === 0 ? "YES" : "NO";
        const desc = descriptions.get(marketId);
        const label = desc ? truncate(desc, 50) : `Market #${marketId}`;
        bets.push({
          text: `${shortenAddress(b.user)} bet ${side} ${formatUSDC(b.amount)} on '${label}'`,
          marketId,
        });
      }
    }

    // Format metrics
    const metrics: TickerItem[] = [];
    if (metricsResult.status === "fulfilled") {
      for (const row of metricsResult.value) {
        const username = extractUsername(row.endpointPath);
        const jsonPath = row.jsonPath;

        let text: string;
        if (jsonPath.includes("total_tweet_count")) {
          // Search count market
          const searchMatch = row.endpointPath.match(/query=([^&]+)/);
          const term = searchMatch ? decodeURIComponent(searchMatch[1]) : "search";
          text = `"${term}" posts: ${formatMetricValue(row.value)}`;
        } else if (username) {
          // Follower-type market
          const metricName = jsonPath.includes("followers_count")
            ? "followers"
            : jsonPath.includes("like_count")
              ? "likes"
              : jsonPath.includes("impression_count")
                ? "views"
                : jsonPath.includes("retweet_count")
                  ? "retweets"
                  : "metric";
          text = `@${username} ${metricName}: ${formatMetricValue(row.value)}`;
        } else {
          // Tweet-type market
          const desc = descriptions.get(row.marketId);
          const metricName = jsonPath.includes("like_count")
            ? "likes"
            : jsonPath.includes("impression_count")
              ? "views"
              : jsonPath.includes("retweet_count")
                ? "retweets"
                : "metric";
          const label = desc ? truncate(desc, 40) : `Market #${row.marketId}`;
          text = `'${label}' ${metricName}: ${formatMetricValue(row.value)}`;
        }

        metrics.push({ text, marketId: row.marketId });
      }
    }

    return NextResponse.json(
      { bets, metrics },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=15",
        },
      },
    );
  } catch (err) {
    console.error("Ticker feed error:", err);
    return NextResponse.json({ bets: [], metrics: [] }, { status: 500 });
  }
}
