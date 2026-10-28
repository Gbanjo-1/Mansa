// Vercel Serverless Function — per-company live data from NGX (ngxgroup.com).
//   GET /api/company?symbol=GTCO
// Returns the day's quote, key trading stats and ~1 month of daily closes.

const UA = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Accept: "application/json,text/plain,*/*",
  "Accept-Language": "en-US,en;q=0.9",
};
const BASE = "https://ngxgroup.com/wp-json/ngx-data-widgets/v1/company/";

async function widget(kind, symbol) {
  const url = `${BASE}${kind}?isin=&symbol=${encodeURIComponent(symbol)}&directory=companydirectory&family=company`;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(url, { headers: UA, signal: ctl.signal });
    if (!r.ok) throw new Error(`${kind} -> ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

const num = (v) => (v === null || v === undefined || v === "" || !isFinite(Number(v)) ? null : Number(v));

export default async function handler(req, res) {
  const symbol = String(req.query?.symbol || "").toUpperCase().trim();
  if (!/^[A-Z0-9.]{2,20}$/.test(symbol)) return res.status(400).json({ error: "Invalid symbol" });

  const [summary, trading, chart] = await Promise.allSettled([
    widget("summary", symbol), widget("trading", symbol), widget("chart", symbol),
  ]);
  const s = summary.status === "fulfilled" ? summary.value || {} : {};
  const t = trading.status === "fulfilled" ? trading.value || {} : {};
  const c = chart.status === "fulfilled" ? chart.value || {} : {};

  const history = (Array.isArray(c.points) ? c.points : [])
    .map(([ts, v]) => [Number(ts) < 1e11 ? Number(ts) * 1000 : Number(ts), Number(v)])
    .filter(([ts, v]) => isFinite(ts) && isFinite(v))
    .sort((a, b) => a[0] - b[0]);

  if (!s.Symbol && !t.Symbol && !history.length) {
    return res.status(502).json({ error: "NGX returned no data for this symbol" });
  }

  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  res.status(200).json({
    symbol,
    name: s.CompanyName || t.CompanyName || null,
    price: num(s.StockPriceCur),
    change: num(s.StockPriceChange),
    changePct: num(s.StockPricePercChange),
    prevClose: num(s.PrevClose),
    open: num(s.OpenPrice),
    dayHigh: num(s.DaysHigh),
    dayLow: num(s.DaysLow),
    high52: num(s.HIGH52WK_PRICE),
    low52: num(s.LOW52WK_PRICE),
    volume: num(s.Volume),
    valueTraded: num(s.Value),
    asOf: s.as_at || null,
    sector: t.Sector || null,
    subSector: t.SubSector || null,
    board: t.MarketClassification || null,
    marketCap: num(t.MarketCap),
    sharesOutstanding: num(t.SharesOutstanding),
    history,
    source: "Nigerian Exchange (ngxgroup.com)",
  });
}
