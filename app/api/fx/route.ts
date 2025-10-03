import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const base = (searchParams.get("base") || "CAD").toUpperCase();
  const target = (searchParams.get("target") || "CAD").toUpperCase();
  if (base === target) return NextResponse.json({ base, target, rate: 1 });

  const key = process.env.EXCHANGE_RATE_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Server missing EXCHANGE_RATE_API_KEY" },
      { status: 500 },
    );
  }

  const url = `https://v6.exchangerate-api.com/v6/${encodeURIComponent(
    key,
  )}/pair/${encodeURIComponent(base)}/${encodeURIComponent(target)}`;
  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: 502 });
    }
    const data = await res.json();
    const rate = Number(data?.conversion_rate);
    if (!Number.isFinite(rate) || rate <= 0) {
      return NextResponse.json({ error: "Rate unavailable" }, { status: 503 });
    }
    return NextResponse.json({ base, target, rate });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch rate" },
      { status: 500 },
    );
  }
}
