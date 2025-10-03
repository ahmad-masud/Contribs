"use client";

import React, { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Item {
  date: string;
  type: "contribution" | "withdrawal";
  amount: number;
}

interface ContributionGraphProps {
  items: Item[];
}

export default function ContributionGraph({ items }: ContributionGraphProps) {
  type Range = "1M" | "3M" | "6M" | "YTD" | "1Y" | "ALL";
  const [range, setRange] = useState<Range>("ALL");

  const series = useMemo(() => {
    const sorted = [...items]
      .filter((it) => !!it.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cumulative = 0;
    return sorted.map((it) => {
      const ts = new Date(it.date).getTime();
      const delta =
        it.type === "withdrawal" ? -Number(it.amount) : Number(it.amount);
      cumulative += delta;
      return {
        ts,
        label: new Date(ts).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        total: Math.round(cumulative * 100) / 100,
      } as { ts: number; label: string; total: number };
    });
  }, [items]);

  const filtered = useMemo(() => {
    if (series.length === 0)
      return [] as Array<{
        ts: number;
        label: string;
        total: number;
        rebased: number;
      }>;
    const now = new Date();
    const earliestTs = series[0].ts;
    const start = new Date(now);
    let startTs = earliestTs;
    switch (range) {
      case "1M":
        start.setMonth(start.getMonth() - 1);
        startTs = start.getTime();
        break;
      case "3M":
        start.setMonth(start.getMonth() - 3);
        startTs = start.getTime();
        break;
      case "6M":
        start.setMonth(start.getMonth() - 6);
        startTs = start.getTime();
        break;
      case "YTD": {
        const y = now.getFullYear();
        startTs = new Date(y, 0, 1).getTime();
        break;
      }
      case "1Y":
        start.setFullYear(start.getFullYear() - 1);
        startTs = start.getTime();
        break;
      case "ALL":
      default:
        startTs = earliestTs;
        break;
    }
    const baselineIdx = series.findIndex((d) => d.ts >= startTs);
    const baseline = baselineIdx <= 0 ? 0 : series[baselineIdx - 1].total;
    const windowed = series.filter((d) => d.ts >= startTs);
    return windowed.map((d) => ({ ...d, rebased: d.total - baseline }));
  }, [series, range]);

  if (series.length === 0)
    return <div className="text-[var(--ws-muted)] text-sm">No data yet</div>;

  return (
    <div className="p-4 bg-[var(--ws-card)] rounded-lg border border-[var(--ws-border)] mt-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-lg">Net Contributions Over Time</h3>
        <div className="flex items-center gap-1">
          {(
            [
              ["1M", "1M"],
              ["3M", "3M"],
              ["6M", "6M"],
              ["YTD", "YTD"],
              ["1Y", "1Y"],
              ["ALL", "All"],
            ] as Array<[Range, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={range === key}
              onClick={() => setRange(key)}
              className={`px-2 py-1 rounded-md border text-xs cursor-pointer transition ${
                range === key
                  ? "bg-[var(--ws-accent)] text-white border-[var(--ws-accent)]"
                  : "border-[var(--ws-border)] text-[var(--ws-text)] hover:bg-[var(--ws-hover)]"
              }`}
              title={label}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart
          data={
            filtered.length
              ? filtered
              : series.map((d) => ({ ...d, rebased: d.total }))
          }
        >
          <CartesianGrid stroke="var(--ws-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="label" hide stroke="var(--ws-axis)" />
          <YAxis hide stroke="var(--ws-axis)" />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--ws-tooltip-bg)",
              border: "1px solid var(--ws-tooltip-border)",
            }}
            itemStyle={{ color: "var(--ws-text)" }}
            labelStyle={{ color: "var(--ws-axis)" }}
          />
          <Line
            type="monotone"
            dataKey="rebased"
            stroke="var(--ws-accent)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
