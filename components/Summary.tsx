"use client";

import React, { useMemo } from "react";
import { formatCurrency } from "../lib/format";

const ANNUAL_LIMITS: Record<number, number> = {
  2009: 5000,
  2010: 5000,
  2011: 5000,
  2012: 5000,
  2013: 5500,
  2014: 5500,
  2015: 10000,
  2016: 5500,
  2017: 5500,
  2018: 5500,
  2019: 6000,
  2020: 6000,
  2021: 6000,
  2022: 6000,
  2023: 6500,
  2024: 7000,
  2025: 7000,
  2026: 7000,
};

function getYearlyLimit(year: number) {
  return ANNUAL_LIMITS[year] ?? 0;
}

interface Item {
  date: string;
  type: "contribution" | "withdrawal";
  amount: number;
}

interface SummaryProps {
  items: Item[];
  birthYear: number;
  allTimeProfit?: number;
  portfolioValue?: number;
  hasHoldings?: boolean;
  cashBalance?: number;
}

export default function Summary({
  items,
  birthYear,
  allTimeProfit,
  portfolioValue,
  hasHoldings,
  cashBalance,
}: SummaryProps) {
  const summary = useMemo(() => {
    const startYear = Math.max(2009, birthYear + 18);
    const currentYear = new Date().getFullYear();

    const byYear: Record<
      number,
      { contributions: number; withdrawals: number }
    > = {};
    for (let y = startYear; y <= currentYear; y++) {
      byYear[y] = { contributions: 0, withdrawals: 0 };
    }

    items.forEach((it) => {
      const y = new Date(it.date).getFullYear();
      if (y < startYear) return;
      if (!byYear[y]) byYear[y] = { contributions: 0, withdrawals: 0 };
      if (it.type === "contribution")
        byYear[y].contributions += Number(it.amount);
      else byYear[y].withdrawals += Number(it.amount);
    });

    let totalContributions = 0;
    let totalWithdrawals = 0;
    for (let y = startYear; y <= currentYear; y++) {
      totalContributions += byYear[y]?.contributions ?? 0;
      totalWithdrawals += byYear[y]?.withdrawals ?? 0;
    }

    let cumulativeLimits = 0;
    for (let y = startYear; y <= currentYear; y++) {
      cumulativeLimits += getYearlyLimit(y);
    }
    let withdrawalsBeforeThisYear = 0;
    for (let y = startYear; y < currentYear; y++) {
      withdrawalsBeforeThisYear += byYear[y]?.withdrawals ?? 0;
    }
    const contributionsUpToCurrent = totalContributions;
    const availableRoomNow = Math.max(
      0,
      cumulativeLimits + withdrawalsBeforeThisYear - contributionsUpToCurrent,
    );

    const thisYearWithdrawals = byYear[currentYear]?.withdrawals ?? 0;

    return {
      byYear,
      totalContributions,
      totalWithdrawals,
      availableRoomNow,
      thisYearWithdrawals,
      startYear,
      currentYear,
    };
  }, [items, birthYear]);

  const contributedYears = Object.keys(summary.byYear)
    .map(Number)
    .filter((y) => summary.byYear[y].contributions > 0)
    .sort((a, b) => b - a);

  return (
    <div className="p-4 bg-[var(--ws-card)] rounded-lg border border-[var(--ws-border)]">
      <h2 className="font-medium text-lg mb-2">Summary</h2>

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-[var(--ws-muted)]">
            Available TFSA room now
          </div>
          <div className="text-2xl font-semibold tabular-nums">
            {formatCurrency(summary.availableRoomNow)}
          </div>
        </div>
        <div>
          <div className="text-sm text-[var(--ws-muted)]">
            Total contributions
          </div>
          <div className="text-2xl font-semibold tabular-nums">
            {formatCurrency(summary.totalContributions)}
          </div>
        </div>
        <div>
          <div className="text-sm text-[var(--ws-muted)]">
            Total withdrawals
          </div>
          <div className="text-2xl font-semibold tabular-nums">
            {formatCurrency(summary.totalWithdrawals)}
          </div>
        </div>
      </div>

      {typeof portfolioValue === "number"
        ? (() => {
            const netContributed = items.reduce(
              (sum, it) =>
                sum +
                (it.type === "contribution"
                  ? Number(it.amount)
                  : -Number(it.amount)),
              0,
            );
            const hasAssets = Boolean(hasHoldings) || Number(cashBalance) > 0;
            if (hasAssets) {
              const profit = portfolioValue - netContributed;
              const percent =
                netContributed > 0 ? (profit / netContributed) * 100 : 0;
              const profitClass =
                profit > 0
                  ? "text-emerald-600"
                  : profit < 0
                    ? "text-rose-600"
                    : "text-[var(--ws-muted)]";
              return (
                <div className="mb-4">
                  <div className="p-3 rounded-md border border-[var(--ws-border)] bg-[var(--ws-card)] flex items-center justify-between gap-4">
                    <div className="text-sm">
                      <div className="text-[var(--ws-muted)]">
                        Portfolio value
                      </div>
                      <div className="text-lg font-semibold tabular-nums">
                        {formatCurrency(portfolioValue)}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-[var(--ws-muted)]">Profit</div>
                      <div
                        className={`text-lg font-semibold tabular-nums ${profitClass}`}
                      >
                        {formatCurrency(profit)}{" "}
                        <span className="text-xs align-middle">
                          ({percent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <div className="text-[var(--ws-muted)]">
                      Net TFSA contributed
                    </div>
                    <div className="tabular-nums">
                      {formatCurrency(netContributed)}
                    </div>
                  </div>
                  {Number(cashBalance) > 0 && (
                    <div className="flex items-center justify-between text-[10px] mt-1">
                      <div className="text-[var(--ws-muted)]">
                        Includes cash
                      </div>
                      <div className="tabular-nums">
                        {formatCurrency(Number(cashBalance))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div className="mb-4">
                <div className="p-3 rounded-md border border-[var(--ws-border)] bg-[var(--ws-card)]">
                  <div className="text-sm text-[var(--ws-muted)] mb-1">
                    No holdings tracked
                  </div>
                  <div className="text-sm text-[var(--ws-muted)]">
                    Add holdings to see portfolio value and profit.
                  </div>
                </div>
                <div
                  className={`flex items-center justify-between text-xs mt-1`}
                >
                  <div className="text-[var(--ws-muted)]">
                    Net TFSA contributed
                  </div>
                  <div className="tabular-nums">
                    {formatCurrency(netContributed)}
                  </div>
                </div>
              </div>
            );
          })()
        : typeof allTimeProfit === "number" && (
            <div className="mb-4 p-3 rounded-md border border-[var(--ws-border)] bg-[var(--ws-card)]">
              <div className="text-sm text-[var(--ws-muted)]">
                All-time profit
              </div>
              <div className="text-2xl font-semibold tabular-nums">
                {formatCurrency(allTimeProfit)}
              </div>
            </div>
          )}

      <div className="mb-4 p-3 rounded-md border border-[var(--ws-border)] bg-[var(--ws-muted-card)]">
        <div className="text-sm text-[var(--ws-muted)]">
          Next year&apos;s added room from this year&apos;s withdrawals
        </div>
        <div className="text-xl font-semibold tabular-nums">
          {formatCurrency(summary.thisYearWithdrawals)}
        </div>
      </div>

      <div>
        <h3 className="font-medium text-md mb-2">Contributions by Year</h3>
        <div className="space-y-1">
          {contributedYears.length === 0 && (
            <div className="text-[var(--ws-muted)] text-sm">
              No contributions yet
            </div>
          )}
          {contributedYears.map((year) => (
            <div
              key={year}
              className="flex justify-between text-[var(--ws-text)]"
            >
              <span>{year}</span>
              <span>{formatCurrency(summary.byYear[year].contributions)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
