// Vercel Serverless Function — live market overview.
//
// Sources (all free, no API key):
//   • NGX (ngxgroup.com)     — All-Share Index level + full daily history
//   • NGX doclib             — market snapshot: market cap, deals, volume, value
//   • open.er-api.com        — USD/NGN exchange rate (daily)
//   • World Bank API         — Nigeria CPI inflation (latest annual)
// Each source is fetched independently; if one fails its field is null and the
// UI falls back for that piece only.

const UA = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Accept: "application/json,text/plain,*/*",
  "Accept-Language": "en-US,en;q=0.9",
};

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

const DAY = 86400000;
const pct = (a, b) => (a && b ? +(((a - b) / b) * 100).toFixed(2) : null);
// last value on or before timestamp t
const valueAt = (series, t) => {
  let v = null;
  for (const [ts, x] of series) { if (ts <= t) v = x; else break; }
  return v;
};

// Calendar date in Lagos (NGX trades on West Africa Time, UTC+1)
const lagosDay = (t = Date.now()) => new Date(t + 3600000).toISOString().slice(0, 10);

async function asi(liveASI) {
  const d = await getJSON("https://ngxgroup.com/wp-json/ngx-data-widgets/v1/home/indices-page?index=ASI&compare=NONE");
  const q = d?.primary?.quote;
  const raw = Array.isArray(q?.IndiciesData) ? q.IndiciesData : [];
  const series = raw
    .map(([t, v]) => [Number(t) < 1e11 ? Number(t) * 1000 : Number(t), Number(v)])
    .filter(([t, v]) => isFinite(t) && isFinite(v) && v > 0)
    .sort((a, b) => a[0] - b[0]);
  if (!series.length) throw new Error("ASI: empty series");

  // NGX's history feed only publishes a day's close the next day, but the market
  // snapshot carries the current level. If it differs from the last published
  // close and today's point is missing, add it so the index is current.
  let live = false;
  const [prevT, prevV] = series[series.length - 1];
  if (liveASI && Math.abs(liveASI - prevV) > 0.005 && lagosDay(prevT) < lagosDay()) {
    series.push([Date.parse(lagosDay() + "T00:00:00Z"), liveASI]);
    live = true;
  }

  const [lastT, last] = series[series.length - 1];
  const yStart = Date.UTC(new Date(lastT).getUTCFullYear(), 0, 1);
  // 30-day annualised volatility from daily log returns
  const recent = series.filter(([t]) => t >= lastT - 45 * DAY).slice(-22);
  const rets = recent.slice(1).map(([, v], i) => Math.log(v / recent[i][1]));
  const mean = rets.reduce((a, b) => a + b, 0) / (rets.length || 1);
  const sd = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, rets.length - 1));

  return {
    value: live ? last : q.currentPrice ?? last,
    chg: live ? pct(last, prevV) : q.changePercentage != null ? +Number(q.changePercentage).toFixed(2) : null,
    asOf: live ? new Date(lastT).toISOString() : q.currentDateTime || new Date(lastT).toISOString(),
    live,
    ytd: pct(last, valueAt(series, yStart - 1) ?? series[0][1]),
    r1m: pct(last, valueAt(series, lastT - 30 * DAY)),
    r1y: pct(last, valueAt(series, lastT - 365 * DAY)),
    vol30: rets.length > 5 ? +(sd * Math.sqrt(252) * 100).toFixed(1) : null,
    // last 5 years of daily closes is plenty for the dashboard (keeps payload small)
    series: series.filter(([t]) => t >= lastT - 5 * 366 * DAY).map(([t, v]) => [t, +v.toFixed(2)]),
  };
}

async function snapshot() {
  const s = await getJSON("https://doclib.ngxgroup.com/REST/api/mrkstat/mrksnapshot");
  return { asi: s.ASI ?? null, cap: s.CAP ?? null, deals: s.DEALS ?? null, volume: s.VOLUME ?? null, value: s.VALUE ?? null };
}

async function fx() {
  const d = await getJSON("https://open.er-api.com/v6/latest/USD");
  const rate = d?.rates?.NGN;
  if (!rate) throw new Error("FX: no NGN rate");
  return { usdngn: +rate.toFixed(2), updated: d.time_last_update_utc || null };
}

async function inflation() {
  const d = await getJSON("https://api.worldbank.org/v2/country/NG/indicator/FP.CPI.TOTL.ZG?format=json&mrnev=1");
  const row = Array.isArray(d) && Array.isArray(d[1]) ? d[1][0] : null;
  if (!row || row.value == null) throw new Error("Inflation: no data");
  return { value: +Number(row.value).toFixed(1), year: row.date, source: "World Bank" };
}

export default async function handler(req, res) {
  const names = ["asi", "snapshot", "fx", "inflation"];
  // Snapshot first (fast) so the index history can be topped up with today's level.
  const snapP = snapshot();
  const results = await Promise.allSettled([
    snapP.catch(() => null).then((s) => asi(s?.asi)), snapP, fx(), inflation(),
  ]);
  const out = { updated: new Date().toISOString(), errors: {} };
  results.forEach((r, i) => {
    out[names[i]] = r.status === "fulfilled" ? r.value : null;
    if (r.status === "rejected") out.errors[names[i]] = String(r.reason?.message || r.reason);
  });
  const ok = results.some((r) => r.status === "fulfilled");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  res.status(ok ? 200 : 502).json(out);
}
