"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { useMarketStats } from "@/hooks/use-market-stats";
import { formatCompactNumber } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricChartProps {
  marketId: number;
  targetValue: bigint;
  metricLabel: string;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts * 1000);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: { timestamp: number } }> }) {
  if (!active || !payload?.length) return null;
  const { value, payload: data } = payload[0];
  return (
    <div className="border border-border bg-card px-3 py-2 font-mono text-xs">
      <p className="text-muted-foreground">{formatTimestamp(data.timestamp)}</p>
      <p className="font-bold text-foreground">{formatCompactNumber(value)}</p>
    </div>
  );
}

export function MetricChart({ marketId, targetValue, metricLabel }: MetricChartProps) {
  const { data } = useMarketStats(marketId);
  const snapshots = data?.snapshots;

  if (!snapshots || snapshots.length === 0) return null;

  const target = Number(targetValue);
  const latest = snapshots[snapshots.length - 1].value;
  const progressPct = target > 0 ? ((latest / target) * 100).toFixed(1) : "—";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-mono uppercase tracking-widest">
            {metricLabel} Progression
          </CardTitle>
          <span className="text-xs font-mono text-muted-foreground">
            {formatCompactNumber(latest)} / {formatCompactNumber(target)} ({progressPct}%)
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={snapshots} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                tick={{ fontSize: 10, fontFamily: "monospace", fill: "#666666" }}
                stroke="#1C1C1C"
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => formatCompactNumber(v)}
                tick={{ fontSize: 10, fontFamily: "monospace", fill: "#666666" }}
                stroke="#1C1C1C"
                tickLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={target}
                stroke="#666666"
                strokeDasharray="4 4"
                label={{
                  value: "TARGET",
                  position: "right",
                  fill: "#666666",
                  fontSize: 9,
                  fontFamily: "monospace",
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#F0F0F0"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: "#F0F0F0", stroke: "#F0F0F0" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
