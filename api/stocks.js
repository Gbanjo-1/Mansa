// Vercel Serverless Function — proxies & parses free public NGX data from AFX
// (afx.kwayisi.org). Returns clean JSON so the static frontend can fetch it
// same-origin (no CORS) and without exposing any third-party endpoint.
//
// Source is a public HTML quote board; we fetch the listing pages, parse the
// main table (ticker, name, volume, price, absolute change) and derive % change.

const PAGES = [
  "https://afx.kwayisi.org/ngx/",
  "https://afx.kwayisi.org/ngx/?page=2",
];

// <tr><td><a .. title="Full Name">TICKER</a><td><a ..>Name</a><td>VOL<td>PRICE<td[ class=hi|lo]>±CHANGE
const ROW =
  /<tr><td><a href=\S+ title="([^"]+)">([A-Z0-9.]+)<\/a><td><a href=\S+[^>]*>[^<]*<\/a><td[^>]*>([\d,]+)<td[^>]*>([\d.,]+)<td[^>]*>([+\-][\d.,]+)/g;

const num = (s) => parseFloat(String(s).replace(/,/g, "")) || 0;

async function fetchPage(url) {
  const r = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    redirect: "follow",
  });
  if (!r.ok) throw new Error(`AFX ${url} -> ${r.status}`);
  return r.text();
}

export default async function handler(req, res) {
  try {
    const htmls = await Promise.all(PAGES.map(fetchPage));
    const byTicker = {};
    for (const html of htmls) {
      let m;
      while ((m = ROW.exec(html)) !== null) {
        const [, name, t, vol, price, chgAbs] = m;
        const p = num(price);
        const ca = num(chgAbs);
        const prev = p - ca;
        const pct = prev > 0 ? +((ca / prev) * 100).toFixed(2) : 0;
        byTicker[t] = { t, n: name.trim(), price: p, chg: pct, chgAbs: ca, vol: num(vol) };
      }
    }
    const stocks = Object.values(byTicker).sort((a, b) => a.t.localeCompare(b.t));

    // Cache at the edge: serve cached for 10 min, allow stale for 30 min while revalidating.
    res.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1800");
    res.status(200).json({ source: "afx.kwayisi.org/ngx", updated: new Date().toISOString(), count: stocks.length, stocks });
  } catch (err) {
    const cause = err?.cause ? `${err.cause.code || ""} ${err.cause.message || err.cause}`.trim() : "";
    res.status(502).json({ error: "Failed to fetch NGX data", detail: String(err), cause });
  }
}
