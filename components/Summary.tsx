// components/Summary.tsx
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
}

export default function Summary({ items, birthYear }: SummaryProps) {
  const summary = useMemo(() => {
    const startYear = Math.max(2009, birthYear + 18);
    const currentYear = new Date().getFullYear();

    // initialize byYear map for all years in range
    const byYear: Record<
      number,
      { contributions: number; withdrawals: number }
    > = {};
    for (let y = startYear; y <= currentYear; y++) {
      byYear[y] = { contributions: 0, withdrawals: 0 };
    }

    // Aggregate amounts, ignore years before eligibility
    items.forEach((it) => {
      const y = new Date(it.date).getFullYear();
      if (y < startYear) return;
      if (!byYear[y]) byYear[y] = { contributions: 0, withdrawals: 0 };
      if (it.type === "contribution")
        byYear[y].contributions += Number(it.amount);
      else byYear[y].withdrawals += Number(it.amount);
    });

    // Totals within eligibility window
    let totalContributions = 0;
    let totalWithdrawals = 0;
    for (let y = startYear; y <= currentYear; y++) {
      totalContributions += byYear[y]?.contributions ?? 0;
      totalWithdrawals += byYear[y]?.withdrawals ?? 0;
    }

    // Room logic:
    // Available now = sum(limits up to currentYear)
    //               + sum(withdrawals for years < currentYear)
    //               - sum(contributions up to currentYear)
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

    const thisYearWithdrawals = byYear[currentYear]?.withdrawals ?? 0; // adds to next year's room

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

  // Only show years where the user contributed
  const contributedYears = Object.keys(summary.byYear)
    .map(Number)
    .filter((y) => summary.byYear[y].contributions > 0)
    .sort((a, b) => b - a); // most recent first

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
              <span>
                {formatCurrency(summary.byYear[year].contributions)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
