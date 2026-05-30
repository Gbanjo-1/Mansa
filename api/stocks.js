// Vercel Serverless Function — free public NGX data.
//
// Source: african-markets.com NGX "Listed Companies" board. It renders one
// server-side HTML table (Company | Sector | Price | 1D | YTD | M.Cap) for the
// whole exchange, and is Cloudflare-hosted so it's reachable from Vercel's
// serverless network (unlike afx.kwayisi.org, which blocks datacenter IPs).
//
// We fetch it, parse the table, and return clean JSON so the static frontend
// can read it same-origin (no CORS, nothing third-party exposed in the browser).

const SOURCE = "https://www.african-markets.com/en/stock-markets/ngse/listed-companies";

// <tr ..><td col_width_1><a ..code=TICKER..>Name</a><td col_width_2>Sector<td col_width_3>Price<td col_width_4>1D…
const ROW =
  /<tr class="tabrow[^"]*"><td class="tabcol  col_width_1"><a href=.listed-companies\/company\?code=([A-Z0-9]+).[^>]*>([^<]+)<\/a><\/td><td class="tabcol  col_width_2">([^<]*)<\/td><td class="tabcol  col_width_3">([\d,]*\.?\d*)<\/td><td class="tabcol  col_width_4">(.*?)<\/td>/g;

const num = (s) => parseFloat(String(s).replace(/,/g, "")) || 0;

export default async function handler(req, res) {
  try {
    const r = await fetch(SOURCE, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    if (!r.ok) throw new Error(`source -> ${r.status}`);
    const html = await r.text();

    const byTicker = {};
    let m;
    while ((m = ROW.exec(html)) !== null) {
      const [, t, name, sector, price, d1] = m;
      const p = num(price);
      if (!p) continue; // skip suspended / no-price rows
      const pm = d1.match(/(-?\d+\.\d+)%/);
      byTicker[t] = { t, n: name.trim(), sector: sector.trim() || "—", price: p, chg: pm ? parseFloat(pm[1]) : 0 };
    }
    const stocks = Object.values(byTicker).sort((a, b) => a.t.localeCompare(b.t));
    if (!stocks.length) throw new Error("parsed 0 rows (source layout may have changed)");

    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=3600");
    res.status(200).json({ source: "african-markets.com (NGX)", updated: new Date().toISOString(), count: stocks.length, stocks });
  } catch (err) {
    const cause = err?.cause ? `${err.cause.code || ""} ${err.cause.message || err.cause}`.trim() : "";
    res.status(502).json({ error: "Failed to fetch NGX data", detail: String(err), cause });
  }
}
