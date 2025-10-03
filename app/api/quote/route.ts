import { NextResponse } from "next/server";
import { BASE_CURRENCY } from "../../../lib/format";

async function fetchRate(base: string, target: string): Promise<number> {
  if (base === target) return 1;
  const key = process.env.EXCHANGE_RATE_API_KEY;
  if (!key) return 1;
  try {
    const url = `https://v6.exchangerate-api.com/v6/${encodeURIComponent(
      key,
    )}/pair/${encodeURIComponent(base)}/${encodeURIComponent(target)}`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return 1;
    const data = await res.json();
    const rate = Number(data?.conversion_rate);
    return Number.isFinite(rate) && rate > 0 ? rate : 1;
  } catch {
    return 1;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const targetCurrency = (searchParams.get("target") || "").toUpperCase();
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
    if (data?.Note || data?.Information) {
      return NextResponse.json(
        { error: "Market data service unavailable (rate limit)" },
        { status: 503 },
      );
    }
    const quote = data?.["Global Quote"] ?? {};
    const price = Number(quote["05. price"]);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: "Unknown symbol" }, { status: 404 });
    }
    const previousClose = Number(quote["08. previous close"]);
    let originalCurrency = "USD";
    if (/\.TO$|\.V$/.test(symbol)) originalCurrency = "CAD";
    let cadPrice = price;
    if (originalCurrency !== BASE_CURRENCY) {
      const r = await fetchRate(originalCurrency, BASE_CURRENCY);
      cadPrice = cadPrice * r;
    }
    let targetPrice: number | null = null;
    let finalTargetCurrency: string | null = null;
    if (targetCurrency && targetCurrency !== originalCurrency) {
      finalTargetCurrency = targetCurrency;
      if (targetCurrency === BASE_CURRENCY) {
        targetPrice = cadPrice;
      } else if (originalCurrency === BASE_CURRENCY) {
        const r2 = await fetchRate(BASE_CURRENCY, targetCurrency);
        targetPrice = price * r2;
      } else {
        const r3 = await fetchRate(BASE_CURRENCY, targetCurrency);
        targetPrice = cadPrice * r3;
      }
    } else if (targetCurrency && targetCurrency === originalCurrency) {
      finalTargetCurrency = originalCurrency;
      targetPrice = price;
    }
    return NextResponse.json({
      symbol,
      original: { price, currency: originalCurrency },
      cad: { price: cadPrice },
      target: finalTargetCurrency
        ? { price: targetPrice, currency: finalTargetCurrency }
        : null,
      previousClose: Number.isFinite(previousClose) ? previousClose : null,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch quote" },
      { status: 500 },
    );
  }
}
