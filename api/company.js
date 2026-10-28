// Vercel Serverless Function — per-company live data from NGX (ngxgroup.com).
//   GET /api/company?symbol=GTCO
//
// Price, change, volume and day range come from NGX's official daily price list
// (doclib.ngxgroup.com), which is current. NGX's company-profile widgets are used
// for slow-moving facts (shares outstanding, board, sector) and price history —
// their quote fields can lag by days, so they are only a fallback, and history /
// 52-week range are reconciled with the current price so they never contradict it.

const UA = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Accept: "application/json,text/plain,*/*",
  "Accept-Language": "en-US,en;q=0.9",
};
const BASE = "https://ngxgroup.com/wp-json/ngx-data-widgets/v1/company/";
const LIST = "https://doclib.ngxgroup.com/REST/api/statistics/equities/?market=&sector=&orderby=&pageSize=500&pageNo=0";

async function getJSON(url, ms = 9000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: UA, signal: ctl.signal });
    if (!r.ok) throw new Error(`${url} -> ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}
const widget = (kind, symbol) =>
  getJSON(`${BASE}${kind}?isin=&symbol=${encodeURIComponent(symbol)}&directory=companydirectory&family=company`);

const num = (v) => (v === null || v === undefined || v === "" || !isFinite(Number(v)) ? null : Number(v));
const day = (t) => new Date(t).toISOString().slice(0, 10);

export default async function handler(req, res) {
  const symbol = String(req.query?.symbol || "").toUpperCase().trim();
  if (!/^[A-Z0-9.]{2,20}$/.test(symbol)) return res.status(400).json({ error: "Invalid symbol" });

  const [listR, summaryR, tradingR, chartR] = await Promise.allSettled([
    getJSON(LIST), widget("summary", symbol), widget("trading", symbol), widget("chart", symbol),
  ]);
  const row = listR.status === "fulfilled" && Array.isArray(listR.value)
    ? listR.value.find((r) => String(r.Symbol || "").trim().toUpperCase() === symbol) || null
    : null;
  const s = summaryR.status === "fulfilled" ? summaryR.value || {} : {};
  const t = tradingR.status === "fulfilled" ? tradingR.value || {} : {};
  const c = chartR.status === "fulfilled" ? chartR.value || {} : {};

  let history = (Array.isArray(c.points) ? c.points : [])
    .map(([ts, v]) => [Number(ts) < 1e11 ? Number(ts) * 1000 : Number(ts), Number(v)])
    .filter(([ts, v]) => isFinite(ts) && isFinite(v) && v > 0)
    .sort((a, b) => a[0] - b[0]);

  if (!row && !s.Symbol && !t.Symbol && !history.length) {
    return res.status(502).json({ error: "NGX returned no data for this symbol" });
  }

  // ---- Current quote: official price list first, profile widget only as fallback
  let price, prevClose, change, changePct, open, dayHigh, dayLow, volume, valueTraded, trades, tradeDate, quoteSource;
  if (row && num(row.ClosePrice)) {
    price = num(row.ClosePrice);
    prevClose = num(row.PrevClosingPrice);
    // Computed from close vs previous close — NGX's PercChange can reflect the day's low.
    changePct = prevClose ? +(((price - prevClose) / prevClose) * 100).toFixed(2) : num(row.PercChange);
    change = prevClose != null ? +(price - prevClose).toFixed(2) : num(row.Change);
    open = num(row.OpeningPrice);
    dayHigh = num(row.HighPrice);
    dayLow = num(row.LowPrice);
    volume = num(row.Volume);
    valueTraded = num(row.Value);
    trades = num(row.Trades);
    tradeDate = row.TradeDate ? String(row.TradeDate).slice(0, 10) : null;
    quoteSource = "NGX daily price list";
  } else {
    price = num(s.StockPriceCur);
    prevClose = num(s.PrevClose);
    change = num(s.StockPriceChange);
    changePct = num(s.StockPricePercChange);
    open = num(s.OpenPrice);
    dayHigh = num(s.DaysHigh);
    dayLow = num(s.DaysLow);
    volume = num(s.Volume);
    valueTraded = num(s.Value);
    trades = null;
    tradeDate = null;
    quoteSource = "NGX company profile (may lag)";
  }

  // ---- Make history end on the current trade date at the current price
  if (price && tradeDate) {
    const last = history[history.length - 1];
    const tdTs = Date.parse(tradeDate + "T00:00:00Z");
    if (!last || day(last[0]) < tradeDate) history.push([tdTs, price]);
    else if (day(last[0]) === tradeDate) history[history.length - 1] = [last[0], price];
  }

  // ---- 52-week range: NGX's profile figure can be stale; widen it to include
  // recent closes and today's price so it can never contradict the quote.
  // Only when NGX actually supplied a 52-week figure — never invent one from a month of data.
  const recent = history.map(([, v]) => v);
  const hi52Src = num(s.HIGH52WK_PRICE), lo52Src = num(s.LOW52WK_PRICE);
  const hiCands = hi52Src != null ? [hi52Src, price, dayHigh, ...recent].filter((v) => v != null) : [];
  const loCands = lo52Src != null ? [lo52Src, price, dayLow, ...recent].filter((v) => v != null && v > 0) : [];
  const profileStale = num(s.StockPriceCur) != null && price != null && Math.abs(num(s.StockPriceCur) - price) > 0.001;

  const shares = num(t.SharesOutstanding);
  // If any NGX source failed, cache briefly so the next request retries soon.
  const complete = [listR, summaryR, tradingR, chartR].every((r) => r.status === "fulfilled");
  res.setHeader("Cache-Control", complete ? "public, s-maxage=300, stale-while-revalidate=600" : "public, s-maxage=60");
  res.status(200).json({
    symbol,
    name: s.CompanyName || t.CompanyName || null,
    price,
    change,
    changePct,
    prevClose,
    open,
    dayHigh,
    dayLow,
    high52: hiCands.length ? Math.max(...hiCands) : null,
    low52: loCands.length ? Math.min(...loCands) : null,
    volume,
    valueTraded,
    trades,
    tradeDate,
    asOf: tradeDate || s.as_at || null,
    sector: t.Sector || row?.Sector || null,
    subSector: t.SubSector || null,
    board: t.MarketClassification || row?.Market || null,
    // market cap recomputed from today's price (NGX's profile figure can lag)
    marketCap: shares && price ? +(shares * price).toFixed(0) : num(t.MarketCap),
    sharesOutstanding: shares,
    history,
    quoteSource,
    profileStale,
    source: "Nigerian Exchange (ngxgroup.com)",
  });
}
