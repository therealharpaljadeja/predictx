import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { metricSnapshots } from "@/lib/db/schema";
import { getUnresolvedMarkets } from "@/lib/server/markets";
import { fetchMetricValue, buildEndpointKey } from "@/lib/twitter-api";
import { desc, eq, and } from "drizzle-orm";

const CRON_SECRET = process.env.CRON_SECRET;
const MIN_INTERVAL_SECONDS = 55 * 60; // 55 minutes

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: Request) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const markets = await getUnresolvedMarkets();
    if (markets.length === 0) {
      return NextResponse.json({ message: "No unresolved markets", collected: 0 });
    }

    const now = Math.floor(Date.now() / 1000);
    const cutoff = now - MIN_INTERVAL_SECONDS;

    // Deduplicate by endpoint+jsonPath so we only call X API once per unique combo
    const endpointMap = new Map<string, { endpointPath: string; jsonPath: string; marketIds: number[] }>();
    for (const m of markets) {
      const key = buildEndpointKey(m.endpointPath, m.jsonPath);
      const existing = endpointMap.get(key);
      if (existing) {
        existing.marketIds.push(m.id);
      } else {
        endpointMap.set(key, {
          endpointPath: m.endpointPath,
          jsonPath: m.jsonPath,
          marketIds: [m.id],
        });
      }
    }

    let collected = 0;
    const errors: string[] = [];

    for (const [key, { endpointPath, jsonPath, marketIds }] of endpointMap) {
      try {
        // Check if snapshot already exists within the interval
        const [recent] = await db
          .select()
          .from(metricSnapshots)
          .where(
            and(
              eq(metricSnapshots.endpointPath, endpointPath),
              eq(metricSnapshots.jsonPath, jsonPath),
            ),
          )
          .orderBy(desc(metricSnapshots.timestamp))
          .limit(1);

        if (recent && recent.timestamp > cutoff) {
          continue; // Skip — already collected recently
        }

        const value = await fetchMetricValue(endpointPath, jsonPath);

        // Insert one row per market
        for (const marketId of marketIds) {
          await db.insert(metricSnapshots).values({
            marketId,
            endpointPath,
            jsonPath,
            value,
            timestamp: now,
          });
          collected++;
        }

        // Rate limit: 1s between unique API calls
        await sleep(1000);
      } catch (err) {
        errors.push(`${key}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json({
      message: "Collection complete",
      markets: markets.length,
      uniqueEndpoints: endpointMap.size,
      collected,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
