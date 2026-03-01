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

function formatAxisValue(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return m % 1 === 0 ? m.toFixed(0) + "M" : m.toFixed(2) + "M";
  }
  if (n >= 1_000) {
    const k = n / 1_000;
    return k % 1 === 0 ? k.toFixed(0) + "K" : k.toFixed(1) + "K";
  }
  return n.toString();
}

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

  const dataMin = Math.min(...snapshots.map((s) => s.value));
  const dataMax = Math.max(...snapshots.map((s) => s.value));
  const yMin = Math.min(dataMin, target) * 0.95;
  const yMax = Math.max(dataMax, target) * 1.05;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono uppercase tracking-widest font-semibold">
          {metricLabel} Progression
        </h2>
        <div className="text-right font-mono">
          <span className="text-lg font-bold text-foreground">{formatCompactNumber(latest)}</span>
          <span className="text-sm text-muted-foreground"> / {formatCompactNumber(target)}</span>
          <span className="ml-2 text-sm font-bold text-foreground">{progressPct}%</span>
        </div>
      </div>
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
                domain={[yMin, yMax]}
                tickCount={5}
                tickFormatter={formatAxisValue}
                tick={{ fontSize: 10, fontFamily: "monospace", fill: "#666666" }}
                stroke="#1C1C1C"
                tickLine={false}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={target}
                stroke="#22c55e"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{
                  value: "TARGET",
                  position: "right",
                  fill: "#22c55e",
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
    </div>
  );
}
