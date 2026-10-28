// Vercel Serverless Function — full NGX equities price list.
//
// Primary source: the Nigerian Exchange's own price list (doclib.ngxgroup.com),
// which is updated during the trading session and carries the trade date.
// african-markets.com is used only for friendly company names / sectors, and as
// a fallback price source if NGX is unreachable.

const UA = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Accept: "text/html,application/json,application/xhtml+xml,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

const NGX = "https://doclib.ngxgroup.com/REST/api/statistics/equities/?market=&sector=&orderby=&pageSize=500&pageNo=0";
const AM = "https://www.african-markets.com/en/stock-markets/ngse/listed-companies";

// <tr ..><td col_width_1><a ..code=TICKER..>Name</a><td col_width_2>Sector<td col_width_3>Price<td col_width_4>1D…
const ROW =
  /<tr class="tabrow[^"]*"><td class="tabcol  col_width_1"><a href=.listed-companies\/company\?code=([A-Z0-9]+).[^>]*>([^<]+)<\/a><\/td><td class="tabcol  col_width_2">([^<]*)<\/td><td class="tabcol  col_width_3">([\d,]*\.?\d*)<\/td><td class="tabcol  col_width_4">(.*?)<\/td>/g;

const num = (s) => {
  if (s === null || s === undefined || s === "") return null;
  const n = parseFloat(String(s).replace(/,/g, ""));
  return isFinite(n) ? n : null;
};
const titleCase = (s) => String(s || "").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

async function get(url, as = "json", ms = 9000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: UA, signal: ctl.signal, redirect: "follow" });
    if (!r.ok) throw new Error(`${url} -> ${r.status}`);
    return as === "json" ? await r.json() : await r.text();
  } finally {
    clearTimeout(timer);
  }
}

async function africanMarkets() {
  const html = await get(AM, "text");
  const byTicker = {};
  let m;
  ROW.lastIndex = 0;
  while ((m = ROW.exec(html)) !== null) {
    const [, t, name, sector, price, d1] = m;
    const pm = d1.match(/(-?\d+\.\d+)%/);
    byTicker[t] = { t, n: name.trim(), sector: sector.trim() || "—", price: num(price) || 0, chg: pm ? parseFloat(pm[1]) : 0 };
  }
  return byTicker;
}

export default async function handler(req, res) {
  const [ngxR, amR] = await Promise.allSettled([get(NGX), africanMarkets()]);
  const am = amR.status === "fulfilled" ? amR.value : {};

  let stocks = [];
  let source = "";
  let tradeDate = null;

  if (ngxR.status === "fulfilled" && Array.isArray(ngxR.value) && ngxR.value.length) {
    source = "Nigerian Exchange (ngxgroup.com)";
    for (const r of ngxR.value) {
      const t = String(r.Symbol || "").trim();
      const price = num(r.ClosePrice);
      if (!t || !price) continue;
      const prev = num(r.PrevClosingPrice);
      // NGX's own % change when published; otherwise derive it from the previous close.
      const chg = num(r.PercChange) ?? (prev ? +(((price - prev) / prev) * 100).toFixed(2) : 0);
      const named = am[t];
      stocks.push({
        t,
        n: named?.n || t,
        sector: named?.sector || titleCase(r.Sector) || "—",
        price,
        chg: +Number(chg).toFixed(2),
        vol: num(r.Volume),
        value: num(r.Value),
        trades: num(r.Trades),
        board: r.Market || null,
      });
      if (r.TradeDate && (!tradeDate || r.TradeDate > tradeDate)) tradeDate = r.TradeDate;
    }
  } else if (Object.keys(am).length) {
    source = "african-markets.com (NGX) — fallback";
    stocks = Object.values(am).filter((s) => s.price);
  }

  if (!stocks.length) {
    const reasons = [ngxR, amR].map((r) => (r.status === "rejected" ? String(r.reason?.message || r.reason) : "empty"));
    return res.status(502).json({ error: "Failed to fetch NGX data", detail: reasons });
  }

  stocks.sort((a, b) => a.t.localeCompare(b.t));
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  res.status(200).json({ source, tradeDate, updated: new Date().toISOString(), count: stocks.length, stocks });
}
