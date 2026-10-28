// Vercel Serverless Function — multi-year daily closing prices for one NGX stock.
//   GET /api/history?symbol=GTCO
//
// NGX itself only publishes ~1 month of per-company history, so longer history
// comes from (in order):
//   1. EODHD end-of-day API — set EODHD_API_KEY in Vercel → Settings → Environment Variables
//   2. afx.kwayisi.org public NGX daily closes (no key; may refuse cloud servers)
// Returns up to ~4 years of [timestampMs, close] pairs, oldest first. If neither
// source answers, responds 502 and the app falls back to NGX's 1-month history.

export const config = { maxDuration: 20 };

const UA = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};
const DAY = 86400000;
const KEEP_MS = 4 * 366 * DAY; // enough for a 3-year view plus its baseline

async function get(url, ms, headers = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: { ...UA, ...headers }, signal: ctl.signal, redirect: "follow" });
    if (!r.ok) throw new Error(`${new URL(url).hostname} -> ${r.status}`);
    return await r.text();
  } catch (e) {
    throw new Error(e?.name === "AbortError" ? `${new URL(url).hostname} timed out` : String(e?.message || e));
  } finally {
    clearTimeout(timer);
  }
}

async function eodhd(symbol, key) {
  const from = new Date(Date.now() - KEEP_MS).toISOString().slice(0, 10);
  const txt = await get(
    `https://eodhd.com/api/eod/${encodeURIComponent(symbol)}.XNSA?api_token=${encodeURIComponent(key)}&fmt=json&period=d&from=${from}`,
    9000, { Accept: "application/json" },
  );
  const rows = JSON.parse(txt);
  if (!Array.isArray(rows)) throw new Error("EODHD: unexpected response");
  // Unadjusted close, so the chart matches the price NGX quotes.
  return rows.map((r) => [Date.parse(r.date + "T00:00:00Z"), Number(r.close)]);
}

async function afx(symbol) {
  const js = await get(`https://afx.kwayisi.org/chart/ngx/${encodeURIComponent(symbol.toLowerCase())}`, 6000,
    { Accept: "application/javascript,*/*;q=0.8", Referer: "https://afx.kwayisi.org/" });
  const out = [];
  const re = /\[d\("(\d{4}-\d{2}-\d{2})"\),\s*([\d.]+)\]/g;
  let m;
  while ((m = re.exec(js)) !== null) out.push([Date.parse(m[1] + "T00:00:00Z"), Number(m[2])]);
  return out;
}

export default async function handler(req, res) {
  const symbol = String(req.query?.symbol || "").toUpperCase().trim();
  if (!/^[A-Z0-9.]{2,20}$/.test(symbol)) return res.status(400).json({ error: "Invalid symbol" });

  const key = process.env.EODHD_API_KEY;
  const sources = [...(key ? [["EODHD", () => eodhd(symbol, key)]] : []), ["afx.kwayisi.org", () => afx(symbol)]];
  const errors = [];
  for (const [name, fn] of sources) {
    try {
      const points = (await fn())
        .filter(([t, v]) => isFinite(t) && isFinite(v) && v > 0)
        .sort((a, b) => a[0] - b[0]);
      if (points.length < 30) throw new Error(`${name}: not enough history for ${symbol}`);
      const last = points[points.length - 1][0];
      const history = points.filter(([t]) => t >= last - KEEP_MS);
      res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=21600");
      return res.status(200).json({ symbol, count: history.length, from: history[0][0], to: last, history, source: name });
    } catch (e) {
      errors.push(String(e?.message || e));
    }
  }
  res.setHeader("Cache-Control", "public, s-maxage=600");
  res.status(502).json({ error: "Long-range price history unavailable", keyConfigured: !!key, detail: errors });
}
