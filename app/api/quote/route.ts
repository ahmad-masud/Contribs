import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "Missing symbol" }, { status: 400 });
  }
  const key = process.env.ALPHA_VANTAGE_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Server missing ALPHA_VANTAGE_API_KEY" },
      { status: 500 },
    );
  }

  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
      symbol,
    )}&apikey=${key}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream error" }, { status: 502 });
    }
    const data = await res.json();
    const quote = data?.["Global Quote"] ?? {};
    const rawPrice = quote["05. price"];
    const price = Number(rawPrice);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Unknown symbol" }, { status: 404 });
    }
    const previousCloseRaw = quote["08. previous close"];
    const previousClose = Number(previousCloseRaw);
    return NextResponse.json({
      symbol,
      price,
      previousClose: Number.isFinite(previousClose) ? previousClose : null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 500 },
    );
  }
}
