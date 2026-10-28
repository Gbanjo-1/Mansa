// Vercel Serverless Function — multi-year daily closing prices for one NGX stock.
//   GET /api/history?symbol=GTCO
//
// NGX itself only publishes ~1 month of per-company history, so this reads the
// daily closes that afx.kwayisi.org publishes for NGX equities (free, public).
// Returns up to ~4 years of [timestampMs, close] pairs, oldest first.

const UA = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Accept: "application/javascript,text/javascript,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://afx.kwayisi.org/",
};
const KEEP_MS = 4 * 366 * 86400000; // enough for a 3-year view plus its baseline

export default async function handler(req, res) {
  const symbol = String(req.query?.symbol || "").toUpperCase().trim();
  if (!/^[A-Z0-9.]{2,20}$/.test(symbol)) return res.status(400).json({ error: "Invalid symbol" });

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
  try {
    const r = await fetch(`https://afx.kwayisi.org/chart/ngx/${encodeURIComponent(symbol.toLowerCase())}`, {
      headers: UA, signal: ctl.signal, redirect: "follow",
    });
    if (!r.ok) throw new Error(`history source -> ${r.status}`);
    const js = await r.text();

    const points = [];
    const re = /\[d\("(\d{4}-\d{2}-\d{2})"\),\s*([\d.]+)\]/g;
    let m;
    while ((m = re.exec(js)) !== null) {
      const t = Date.parse(m[1] + "T00:00:00Z");
      const v = Number(m[2]);
      if (isFinite(t) && isFinite(v) && v > 0) points.push([t, v]);
    }
    if (!points.length) throw new Error("no price history found for this symbol");
    points.sort((a, b) => a[0] - b[0]);
    const last = points[points.length - 1][0];
    const history = points.filter(([t]) => t >= last - KEEP_MS);

    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=3600");
    res.status(200).json({ symbol, count: history.length, from: history[0][0], to: last, history, source: "afx.kwayisi.org (NGX daily closes)" });
  } catch (err) {
    res.setHeader("Cache-Control", "public, s-maxage=120");
    res.status(502).json({ error: "Price history unavailable", detail: String(err?.message || err) });
  } finally {
    clearTimeout(timer);
  }
}
