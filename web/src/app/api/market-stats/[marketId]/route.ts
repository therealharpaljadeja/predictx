import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { metricSnapshots } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ marketId: string }> },
) {
  const { marketId: rawId } = await params;
  const marketId = parseInt(rawId, 10);

  if (isNaN(marketId)) {
    return NextResponse.json({ error: "Invalid marketId" }, { status: 400 });
  }

  const snapshots = await db
    .select({
      value: metricSnapshots.value,
      timestamp: metricSnapshots.timestamp,
    })
    .from(metricSnapshots)
    .where(eq(metricSnapshots.marketId, marketId))
    .orderBy(asc(metricSnapshots.timestamp));

  return NextResponse.json(
    { marketId, snapshots },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    },
  );
}
