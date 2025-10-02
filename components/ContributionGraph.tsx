// components/ContributionGraph.tsx
"use client";

import React, { useMemo } from "react";
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
  const data = useMemo(() => {
    // Sort records by date ascending and compute net cumulative (contrib - withdrawal)
    const sorted = [...items].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    let cumulative = 0;
    return sorted.map((it) => {
      const delta =
        it.type === "withdrawal" ? -Number(it.amount) : Number(it.amount);
      cumulative += delta;
      return {
        date: new Date(it.date).toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        }),
        total: Math.round(cumulative * 100) / 100,
      };
    });
  }, [items]);

  if (data.length === 0)
    return <div className="text-[var(--ws-muted)] text-sm">No data yet</div>;

  return (
    <div className="p-4 bg-[var(--ws-card)] rounded-lg border border-[var(--ws-border)] mt-2">
      <h3 className="font-medium text-lg mb-2">Net Contributions Over Time</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid stroke="var(--ws-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="var(--ws-axis)" />
          <YAxis stroke="var(--ws-axis)" />
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
            dataKey="total"
            stroke="var(--ws-accent)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
