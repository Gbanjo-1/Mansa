import React, { useState, useMemo, useEffect, useContext, createContext, useRef } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";

/* ============================================================
   NGX INTELLIGENCE — representative (mock) data layer.
   Swap these objects for live NGX / SEC / macro API responses.
   ============================================================ */

const ACCENT = "#00E5A0";
const RED = "#FF4D6D";
const AMBER = "#FFB454";
const BLUE = "#4DA6FF";
const PANEL = "rgba(255,255,255,0.04)";
const BORDER = "rgba(255,255,255,0.08)";

const MARKET = {
  asi: 99847.32,
  asiChange: 1.24,
  mktCap: 54.8, // trillion NGN
  mktCapChange: 1.18,
  sentiment: 62,
  opportunity: 58,
  risk: 47,
  econHealth: 54,
  foreignFlow: -3.2, // net % MoM
  inflation: 33.2,
  naira: 41, // strength index 0-100
};

const asiSeries = [
  { d: "Jan", v: 84200 }, { d: "Feb", v: 88100 }, { d: "Mar", v: 91500 },
  { d: "Apr", v: 90200 }, { d: "May", v: 94800 }, { d: "Jun", v: 97300 },
  { d: "Jul", v: 95900 }, { d: "Aug", v: 98600 }, { d: "Sep", v: 99847 },
];

const sectors = [
  { name: "Banking", perf: 3.1, cap: 12.4 },
  { name: "Industrial", perf: 1.8, cap: 14.9 },
  { name: "Telecoms", perf: 2.4, cap: 9.2 },
  { name: "Consumer", perf: -0.9, cap: 6.1 },
  { name: "Oil & Gas", perf: -1.6, cap: 4.8 },
  { name: "Insurance", perf: 0.7, cap: 1.3 },
  { name: "Agriculture", perf: 2.0, cap: 1.6 },
  { name: "Cement", perf: 1.1, cap: 8.0 },
];

const SEED = [
  {
    t: "DANGCEM", n: "Dangote Cement", sector: "Cement", price: 478.5, chg: 1.2,
    pe: 11.4, pb: 2.9, roe: 26, de: 0.62, div: 4.1, rev: 14, eps: 9,
    health: 82, rating: "Buy", fcf: "Strong",
    p30: 61, p90: 64, p1y: 68, p3y: 72, risk: "Moderate",
    reason: "Pricing power and pan-African capacity expansion support margins; FX exposure on energy inputs is the main watch item.",
  },
  {
    t: "MTNN", n: "MTN Nigeria", sector: "Telecoms", price: 232.0, chg: 2.4,
    pe: 18.2, pb: 9.1, roe: 41, de: 1.9, div: 5.2, rev: 22, eps: -8,
    health: 71, rating: "Hold", fcf: "Strong",
    p30: 52, p90: 55, p1y: 60, p3y: 66, risk: "Elevated",
    reason: "Subscriber and data growth strong, but naira-driven FX losses on foreign-currency obligations have pressured reported earnings.",
  },
  {
    t: "GTCO", n: "Guaranty Trust Holding", sector: "Banking", price: 58.9, chg: 3.1,
    pe: 3.2, pb: 1.1, roe: 34, de: 0.0, div: 9.8, rev: 41, eps: 38,
    health: 88, rating: "Strong Buy", fcf: "Strong",
    p30: 67, p90: 70, p1y: 71, p3y: 69, risk: "Moderate",
    reason: "Best-in-class efficiency, high ROE, and a deep dividend yield; banking sector recapitalization is the structural variable to monitor.",
  },
  {
    t: "ZENITHBANK", n: "Zenith Bank", sector: "Banking", price: 41.2, chg: 2.8,
    pe: 2.9, pb: 0.8, roe: 31, de: 0.0, div: 11.2, rev: 38, eps: 35,
    health: 85, rating: "Strong Buy", fcf: "Strong",
    p30: 65, p90: 68, p1y: 69, p3y: 67, risk: "Moderate",
    reason: "Trades below book with a very high dividend yield; capital raise needs and asset quality through the cycle are the key risks.",
  },
  {
    t: "AIRTELAFRI", n: "Airtel Africa", sector: "Telecoms", price: 2210.0, chg: -0.6,
    pe: 24.1, pb: 4.4, roe: 19, de: 1.4, div: 2.3, rev: 11, eps: 4,
    health: 68, rating: "Hold", fcf: "Moderate",
    p30: 48, p90: 51, p1y: 57, p3y: 63, risk: "Elevated",
    reason: "Multi-market footprint diversifies revenue, but valuation is rich versus local peers and currency translation drags reported figures.",
  },
  {
    t: "BUACEMENT", n: "BUA Cement", sector: "Cement", price: 96.0, chg: 0.9,
    pe: 13.8, pb: 3.6, roe: 22, de: 0.71, div: 3.4, rev: 12, eps: 6,
    health: 76, rating: "Buy", fcf: "Moderate",
    p30: 55, p90: 58, p1y: 62, p3y: 65, risk: "Moderate",
    reason: "Capacity additions and a lower cost base aid competitiveness; heavy capex cycle tempers near-term free cash flow.",
  },
  {
    t: "NESTLE", n: "Nestlé Nigeria", sector: "Consumer", price: 980.0, chg: -1.4,
    pe: 28.0, pb: 21.0, roe: 38, de: 3.2, div: 1.9, rev: 9, eps: -22,
    health: 58, rating: "Watchlist", fcf: "Weak",
    p30: 39, p90: 43, p1y: 50, p3y: 60, risk: "High",
    reason: "Strong brand and pricing, but FX losses pushed it into negative equity territory; recovery hinges on naira stability.",
  },
  {
    t: "SEPLAT", n: "Seplat Energy", sector: "Oil & Gas", price: 4250.0, chg: -1.6,
    pe: 9.1, pb: 1.7, roe: 18, de: 0.95, div: 6.0, rev: 28, eps: 15,
    health: 70, rating: "Buy", fcf: "Strong",
    p30: 50, p90: 54, p1y: 59, p3y: 61, risk: "Elevated",
    reason: "Onshore asset acquisition lifts production scale; oil-price and regulatory exposure drive the wide outcome range.",
  },
];

const benchmarks = {
  // rebased to 100 at period start; representative
  NGX: [100, 104, 109, 107, 113, 116, 114, 117, 119],
  SP500: [100, 102, 103, 101, 105, 107, 106, 109, 111],
  NASDAQ: [100, 103, 105, 102, 108, 111, 109, 113, 116],
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
  // risk-adjusted: return %, volatility %, USD-adjusted return %
  table: [
    { idx: "NGX All-Share", ret: 19.0, vol: 18.5, usd: -7.5, note: "High local return, but naira depreciation erodes USD returns." },
    { idx: "S&P 500", ret: 11.0, vol: 12.1, usd: 11.0, note: "Lower nominal return, lower volatility, no FX drag for USD investors." },
    { idx: "NASDAQ", ret: 16.0, vol: 17.0, usd: 16.0, note: "Higher growth, higher volatility, tech-concentrated." },
  ],
};

const RATING_COLOR = {
  "Strong Buy": ACCENT, Buy: "#7CE38B", Hold: AMBER, Watchlist: "#FF9F45", Avoid: RED,
};
const RISK_COLOR = { Low: ACCENT, Moderate: AMBER, Elevated: "#FF9F45", High: RED };

// Value helper: real value or a clearly-marked "N/A — not in free public source".
const NA = "N/A";
const has = (v) => v !== undefined && v !== null && v !== "";
const fmt = (v, suffix = "") => (has(v) ? `${v}${suffix}` : NA);
// Transparent 1-day momentum read derived purely from the live price change.
const momentumOf = (chg) =>
  !has(chg) ? NA : chg >= 3 ? "Strong ▲" : chg > 0 ? "Up ▲" : chg === 0 ? "Flat —" : chg > -3 ? "Down ▼" : "Strong ▼";

/* ---------- Company logos ----------
   Ticker -> official website domain. The logo is pulled from the site's icon
   (Google favicon service, 128px). Anything unmapped, or whose icon fails /
   comes back as the tiny default globe, falls back to a branded monogram so
   every listed company always shows a mark next to its symbol. */
const LOGO_DOMAINS = {
  ACCESSCORP: "accessbankplc.com", AIICO: "aiicoplc.com", AIRTELAFRI: "airtel.africa",
  ARADEL: "aradel.com", BUACEMENT: "buacement.com", BUAFOODS: "buafoodsplc.com",
  CONOIL: "conoilplc.com", CUSTODIAN: "custodianplc.com.ng", DANGCEM: "dangotecement.com",
  DANGSUGAR: "dangotesugar.com.ng", ETI: "ecobank.com", FBNH: "firstbanknigeria.com",
  FIRSTHOLDCO: "firstbanknigeria.com", FCMB: "fcmb.com", FIDELITYBK: "fidelitybank.ng",
  FIDSON: "fidson.com", FLOURMILL: "fmnplc.com", GTCO: "gtcoplc.com",
  GUINNESS: "guinness-nigeria.com", JAIZBANK: "jaizbankplc.com", JBERGER: "julius-berger.com",
  MAYBAKER: "may-baker.com", MTNN: "mtn.ng", NB: "nbplc.com", NESTLE: "nestle-cwa.com",
  NGXGROUP: "ngxgroup.com", OANDO: "oandoplc.com", OKOMUOIL: "okomuoil.com",
  PRESCO: "presco-plc.com", PZ: "pzcussons.com", SEPLAT: "seplatenergy.com",
  STANBIC: "stanbicibtc.com", STERLINGNG: "sterling.ng", TOTAL: "totalenergies.ng",
  TOTALENERG: "totalenergies.ng", TRANSCOHOT: "transcorphotels.com", TRANSCORP: "transcorpnigeria.com",
  UACN: "uacnplc.com", UBA: "ubagroup.com", UCAP: "unitedcapitalplcgroup.com",
  UNILEVER: "unilevernigeria.com", WAPCO: "lafarge.com.ng", WEMABANK: "wemabank.com",
  ZENITHBANK: "zenithbank.com",
};

const monogramOf = (c) => {
  const words = String(c.n || c.t).replace(/\b(plc|nigeria|ltd|limited|holdings?|group|company|of|the|and)\b/gi, "").trim().split(/\s+/).filter(Boolean);
  const init = words.length >= 2 ? words[0][0] + words[1][0] : (words[0] || c.t).slice(0, 2);
  return init.toUpperCase();
};
const hueOf = (t) => [...String(t)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 360, 7);

function CompanyLogo({ c, size = 28 }) {
  const domain = LOGO_DOMAINS[c.t];
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [c.t]);
  const radius = Math.round(size * 0.28);
  const box = { width: size, height: size, minWidth: size, borderRadius: radius, display: "inline-flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 };
  if (domain && !failed) {
    return (
      <span style={{ ...box, background: "#fff", border: `1px solid ${BORDER}` }} title={`${c.n || c.t} (${c.t})`}>
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
          alt={`${c.n || c.t} logo`} loading="lazy"
          style={{ width: "78%", height: "78%", objectFit: "contain" }}
          onError={() => setFailed(true)}
          onLoad={(e) => { if (e.currentTarget.naturalWidth <= 16) setFailed(true); }}
        />
      </span>
    );
  }
  const h = hueOf(c.t);
  return (
    <span title={`${c.n || c.t} (${c.t})`} style={{
      ...box, background: `linear-gradient(135deg, hsl(${h} 55% 32%), hsl(${(h + 40) % 360} 60% 20%))`,
      border: `1px solid hsl(${h} 50% 45% / 0.5)`, color: "#fff",
      fontFamily: "Sora", fontWeight: 800, fontSize: Math.max(9, Math.round(size * 0.38)), letterSpacing: 0.3,
    }}>{monogramOf(c)}</span>
  );
}

// Beginner mode: plain-English explanation under each metric.
const BeginnerCtx = createContext(false);
const EXPLAIN = {
  "Last Price": "Latest traded price of one share on the NGX.",
  "Market Cap": "Total value of all the company's shares at today's price.",
  "52-Week Range": "Lowest and highest closing price over the past year.",
  "Day Range": "Lowest and highest price traded in the latest session.",
  "Volume": "Number of shares that changed hands in the latest session.",
  "Value Traded": "Naira value of all shares traded in the latest session.",
  "Shares Outstanding": "Total number of the company's shares in issue.",
  "Board": "NGX listing tier (Premium, Main, Growth…).",
  "Financial Health": "Overall balance-sheet strength score. Above 75 is solid.",
  "Free Cash Flow": "Cash left after running and investing in the business — what can fund dividends.",
  "Revenue Growth": "How fast sales grew versus last year.",
  "EPS Growth": "How fast profit per share grew. Negative means earnings fell.",
  "P/E": "Price ÷ earnings per share. Lower can mean cheaper — compare within a sector.",
  "P/B": "Price ÷ book value. Below 1 means the market values it under its net assets.",
  "ROE": "Profit made on shareholders' money. 15%+ is generally strong.",
  "Debt / Equity": "Borrowing relative to shareholders' money. Higher = more leverage risk.",
  "Dividend Yield": "Yearly dividend as a % of the share price.",
  "Risk Level": "Overall volatility and business risk rating.",
  "Price Momentum (1D)": "Direction and strength of today's price move.",
  "AI Rating": "Model's overall view combining value, quality and momentum.",
  "Outperform · 30d": "Model's estimated chance of beating the NGX index over 30 days.",
  "Outperform · 90d": "Estimated chance of beating the index over 90 days.",
  "Outperform · 1yr": "Estimated chance of beating the index over 1 year.",
  "Outperform · 3yr": "Estimated chance of beating the index over 3 years.",
};

function Metric({ label, value, color }) {
  const beginner = useContext(BeginnerCtx);
  const na = value === NA;
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 12px", border: `1px solid ${BORDER}` }}>
      <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "JetBrains Mono", marginTop: 3, color: na ? "rgba(255,255,255,0.28)" : color || "#fff" }}>{value}</div>
      {beginner && EXPLAIN[label] && (
        <div style={{ fontSize: 10.5, lineHeight: 1.45, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>{EXPLAIN[label]}</div>
      )}
    </div>
  );
}

const SampleTag = () => (
  <span title="Representative figure — not live data" style={{ marginLeft: 6, fontSize: 9, letterSpacing: 0.6, padding: "1px 5px", borderRadius: 4, border: `1px solid ${AMBER}55`, color: AMBER, verticalAlign: "middle" }}>SAMPLE</span>
);

// Safe browser storage (private windows / blocked storage just fall back to defaults).
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
};

function ProfileSection({ title, note, children, sample }) {
  return (
    <div className="glass" style={{ borderRadius: 16, padding: 18, marginTop: 14 }}>
      <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14, marginBottom: note ? 3 : 12 }}>{title}{sample && <SampleTag />}</div>
      {note && <div style={{ fontSize: 10.5, color: AMBER, marginBottom: 12 }}>{note}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(125px, 1fr))", gap: 10 }}>{children}</div>
    </div>
  );
}

/* ============================================================ */

function Gauge({ label, value, suffix = "", invert = false, hint, sample }) {
  const pct = Math.max(0, Math.min(100, value));
  const good = invert ? 100 - pct : pct;
  const color = good > 66 ? ACCENT : good > 40 ? AMBER : RED;
  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, letterSpacing: 0.5, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{label}{sample && <SampleTag />}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
        <span style={{ fontSize: 26, fontWeight: 700, color }}>{value}{suffix}</span>
      </div>
      <div style={{ height: 5, borderRadius: 4, background: "rgba(255,255,255,0.08)", marginTop: 10, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width .6s ease" }} />
      </div>
      {hint && <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", marginTop: 7 }}>{hint}</div>}
    </div>
  );
}

function Stat({ label, value, change, fmt, sample, sub }) {
  const up = change >= 0;
  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, letterSpacing: 0.5, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{label}{sample && <SampleTag />}</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(value)}</div>
      {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{sub}</div>}
      {change !== undefined && (
        <div style={{ fontSize: 12.5, marginTop: 4, color: up ? ACCENT : RED, fontWeight: 600 }}>
          {up ? "▲" : "▼"} {Math.abs(change)}%
        </div>
      )}
    </div>
  );
}

const tipStyle = { background: "#0a0a0a", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12 };

// Formatting helpers for live data
const signedPct = (v) => (v == null || !isFinite(v) ? NA : `${v >= 0 ? "+" : ""}${Number(v).toFixed(2)}%`);
const pctChange = (a, b) => (a && b ? ((a - b) / b) * 100 : null);
const nairaBig = (v) => {
  if (v == null || !isFinite(v)) return NA;
  const a = Math.abs(v);
  if (a >= 1e12) return `₦${(v / 1e12).toFixed(2)}tn`;
  if (a >= 1e9) return `₦${(v / 1e9).toFixed(2)}bn`;
  if (a >= 1e6) return `₦${(v / 1e6).toFixed(1)}m`;
  return `₦${Math.round(v).toLocaleString()}`;
};
const countBig = (v) => (v == null ? NA : v >= 1e9 ? `${(v / 1e9).toFixed(2)}bn` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}m` : Math.round(v).toLocaleString());
const fmtDate = (d) => {
  const x = new Date(d);
  return isNaN(x) ? "—" : x.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};
const fmtTick = (t, range) => {
  const x = new Date(t);
  return ["1M", "3M"].includes(range)
    ? x.toLocaleDateString(undefined, { day: "numeric", month: "short" })
    : x.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
};
const ASI_RANGES = [["1M", "last month"], ["3M", "last 3 months"], ["6M", "last 6 months"], ["YTD", "year to date"], ["1Y", "last year"], ["5Y", "last 5 years"]];
const rangeStart = (end, k) => {
  const d = new Date(end);
  if (k === "1M") d.setMonth(d.getMonth() - 1);
  else if (k === "3M") d.setMonth(d.getMonth() - 3);
  else if (k === "6M") d.setMonth(d.getMonth() - 6);
  else if (k === "YTD") return new Date(d.getFullYear(), 0, 1).getTime();
  else if (k === "1Y") d.setFullYear(d.getFullYear() - 1);
  else d.setFullYear(d.getFullYear() - 5);
  return d.getTime();
};

export default function App() {
  const [tab, setTab] = useState("dashboard");
  // The curated 8 carry full AI analytics. Live data from the public feed is
  // merged on top (and adds the rest of the exchange) once it loads.
  const SEEDED = useMemo(() => SEED.map((c) => ({ ...c, hasAnalytics: true })), []);
  const [companies, setCompanies] = useState(SEEDED);
  const [dataNote, setDataNote] = useState("Showing curated sample — loading live NGX prices…");
  const [sel, setSel] = useState(SEED[2]);
  const [cmp, setCmp] = useState([SEED[2], SEED[3], SEED[0]]);
  const [advanced, setAdvanced] = useState(() => store.get("mansa.advanced", true));
  useEffect(() => { store.set("mansa.advanced", advanced); }, [advanced]);
  const [live, setLive] = useState(false);
  // Per-company NGX data (quote, key stats, ~1 month of daily closes), cached by symbol
  const [coData, setCoData] = useState({});

  // Auto-refresh: every 5 minutes while the tab is visible, whenever the tab
  // comes back into view after 5+ minutes, and on demand via the Refresh button.
  const REFRESH_MS = 5 * 60 * 1000;
  const [refreshTick, setRefreshTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const lastRefreshRef = useRef(0);
  const refreshNow = () => { setCoData({}); setRefreshTick((n) => n + 1); };
  useEffect(() => {
    const id = setInterval(() => { if (document.visibilityState === "visible") refreshNow(); }, REFRESH_MS);
    const onVis = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRefreshRef.current > REFRESH_MS) refreshNow();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Live market overview (ASI, market snapshot, FX, inflation)
  const [market, setMarket] = useState(null);
  const [asiRange, setAsiRange] = useState("1Y");
  useEffect(() => {
    let cancelled = false;
    fetch("/api/market", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { if (!cancelled && (d.asi || d.snapshot || d.fx || d.inflation)) setMarket(d); })
      .catch(() => {}); // keep showing the last good data
    return () => { cancelled = true; };
  }, [refreshTick]);
  const asi = market?.asi || null;
  const snap = market?.snapshot || null;
  const fx = market?.fx || null;
  const infl = market?.inflation || null;
  const asiChart = useMemo(() => {
    if (!asi?.series?.length) return [];
    const end = asi.series[asi.series.length - 1][0];
    const start = rangeStart(end, asiRange);
    const pts = asi.series.filter(([t]) => t >= start);
    const step = Math.max(1, Math.floor(pts.length / 400)); // keep the chart light
    return pts.filter((_, i) => i % step === 0 || i === pts.length - 1).map(([t, v]) => ({ t, v }));
  }, [asi, asiRange]);


  // Fetch the full NGX universe + live prices from our serverless proxy (free,
  // public AFX data). Curated names keep their analytics + get live price;
  // every other listed company becomes searchable with a real live quote.
  const [feed, setFeed] = useState(null); // { tradeDate, count, source }
  useEffect(() => {
    let cancelled = false;
    setRefreshing(true);
    fetch("/api/stocks", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (cancelled || !data?.stocks?.length) return;
        const seedByT = Object.fromEntries(SEEDED.map((c) => [c.t, c]));
        const merged = data.stocks.map((s) => {
          const rich = seedByT[s.t];
          return rich
            ? { ...rich, price: s.price, chg: s.chg, vol: s.vol, lv: true }
            : { t: s.t, n: s.n, sector: s.sector || "—", price: s.price, chg: s.chg, vol: s.vol, hasAnalytics: false, lv: true };
        });
        const liveTs = new Set(merged.map((c) => c.t));
        SEEDED.forEach((c) => { if (!liveTs.has(c.t)) merged.push(c); });
        merged.sort((a, b) => a.t.localeCompare(b.t));
        if (cancelled) return;
        setCompanies(merged);
        setLive(true);
        setSel((prev) => merged.find((c) => c.t === prev.t) || prev);
        setFeed({ tradeDate: data.tradeDate, count: data.count, source: data.source });
        setDataNote("");
        lastRefreshRef.current = Date.now();
        setLastRefresh(new Date());
      })
      .catch(() => {
        if (cancelled) return;
        // Keep the last good prices on a failed refresh; only fall back to the sample if we never loaded.
        setDataNote((n) => (lastRefreshRef.current ? "Refresh failed — showing last loaded prices." : "Live data unavailable — showing curated sample."));
      })
      .finally(() => { if (!cancelled) setRefreshing(false); });
    return () => { cancelled = true; };
  }, [SEEDED, refreshTick]);

  // AI Research Assistant
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  useEffect(() => { setChat([]); setInput(""); }, [sel.t]);
  useEffect(() => {
    const t = sel.t;
    if (coData[t] && !coData[t].error) return;
    let cancelled = false;
    setCoData((p) => ({ ...p, [t]: { loading: true } }));
    fetch(`/api/company?symbol=${encodeURIComponent(t)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => { if (!cancelled) setCoData((p) => ({ ...p, [t]: d })); })
      .catch(() => { if (!cancelled) setCoData((p) => ({ ...p, [t]: { error: true } })); });
    return () => { cancelled = true; setCoData((p) => (p[t]?.loading ? { ...p, [t]: undefined } : p)); };
  }, [sel.t, refreshTick]); // eslint-disable-line react-hooks/exhaustive-deps
  const cd = coData[sel.t] || {};

  // Screener
  const [screen, setScreen] = useState("all");

  // Company search
  const [search, setSearch] = useState("");
  const matches = companies.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return c.t.toLowerCase().includes(q) || c.n.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q);
  });

  // Watchlists
  const [lists, setLists] = useState(() => store.get("mansa.watchlists", {
    "Dividend Portfolio": ["GTCO", "ZENITHBANK"],
    "Growth Portfolio": ["MTNN", "BUACEMENT"],
    "Value Portfolio": ["DANGCEM"],
  }));
  useEffect(() => { store.set("mansa.watchlists", lists); }, [lists]);
  const [activeList, setActiveList] = useState(() => Object.keys(store.get("mansa.watchlists", {}))[0] || "Dividend Portfolio");
  const [wlSearch, setWlSearch] = useState("");
  const [newList, setNewList] = useState("");
  const createList = () => {
    const name = newList.trim();
    if (!name || lists[name]) return;
    setLists((p) => ({ ...p, [name]: [] }));
    setActiveList(name);
    setNewList("");
  };
  const deleteList = (name) => {
    setLists((p) => {
      const { [name]: _, ...rest } = p;
      const next = Object.keys(rest).length ? rest : { "My Watchlist": [] };
      setActiveList(Object.keys(next)[0]);
      return next;
    });
  };

  // Global search
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchMatches = query.trim()
    ? companies.filter((c) =>
        c.t.toLowerCase().includes(query.toLowerCase()) ||
        c.n.toLowerCase().includes(query.toLowerCase()) ||
        c.sector.toLowerCase().includes(query.toLowerCase())
      )
    : [];
  // Shareable links: #/company/GTCO, #/compare, #/watchlist …
  const TABS = ["dashboard", "company", "compare", "screener", "watchlist", "benchmark"];
  const pendingTicker = useRef(null);
  const readHash = () => {
    const [, t, ticker] = (window.location.hash || "").split("/");
    if (t && TABS.includes(t)) setTab(t);
    if (ticker) pendingTicker.current = decodeURIComponent(ticker).toUpperCase();
  };
  useEffect(() => {
    readHash();
    window.addEventListener("hashchange", readHash);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);
  useEffect(() => {
    // Resolve a linked ticker once the company universe (incl. live feed) has it.
    const want = pendingTicker.current;
    if (!want) return;
    const c = companies.find((x) => x.t === want);
    if (c) { setSel(c); setTab("company"); pendingTicker.current = null; }
    else if (live) pendingTicker.current = null; // unknown ticker — give up
  });
  useEffect(() => {
    if (pendingTicker.current) return; // don't overwrite a link we haven't resolved yet
    const h = tab === "company" ? `#/company/${sel.t}` : `#/${tab}`;
    if (window.location.hash !== h) window.history.replaceState(null, "", h);
  }, [tab, sel.t]);

  // Live market breadth + sector heat map computed from the NGX feed.
  const liveOnly = useMemo(() => (live ? companies.filter((c) => c.lv) : companies), [companies, live]);
  const breadth = useMemo(() => {
    const companies = liveOnly;
    const up = companies.filter((c) => c.chg > 0).length;
    const down = companies.filter((c) => c.chg < 0).length;
    const avg = companies.length ? companies.reduce((s, c) => s + (c.chg || 0), 0) / companies.length : 0;
    return { up, down, flat: companies.length - up - down, avg: +avg.toFixed(2), total: companies.length };
  }, [liveOnly]);
  const liveSectors = useMemo(() => {
    const g = {};
    liveOnly.forEach((c) => {
      if (!c.sector || c.sector === "—") return;
      (g[c.sector] ||= []).push(c.chg || 0);
    });
    return Object.entries(g)
      .map(([name, arr]) => ({ name, perf: +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2), count: arr.length }))
      .sort((a, b) => b.count - a.count);
  }, [liveOnly]);

  const pickCompany = (c) => {
    setSel(c);
    setTab("company");
    setQuery("");
    setSearchOpen(false);
  };

  const screens = {
    all: () => true,
    undervalued: (c) => c.pe < 12 || c.pb < 1.2,
    growth: (c) => c.rev >= 20,
    dividend: (c) => c.div >= 5,
    lowrisk: (c) => c.risk === "Low" || c.risk === "Moderate",
    momentum: (c) => c.chg >= 2,
  };
  const screened = companies.filter((c) => c.hasAnalytics && screens[screen](c));

  const toggleList = (ticker) =>
    setLists((p) => {
      const cur = p[activeList] || [];
      return { ...p, [activeList]: cur.includes(ticker) ? cur.filter((t) => t !== ticker) : [...cur, ticker] };
    });

  async function askAI(question) {
    const q = question.trim();
    if (!q || thinking) return;
    const next = [...chat, { role: "user", content: q }];
    setChat(next);
    setInput("");
    setThinking(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: (() => {
            const { history, loading, error, ...ngx } = coData[sel.t] || {};
            return {
              ...sel,
              ngxLive: ngx.symbol ? ngx : undefined,
              priceLastMonth: history?.length ? { from: history[0][1], to: history[history.length - 1][1] } : undefined,
              market: asi ? { asi: asi.value, asiYtdPct: asi.ytd, asi1yPct: asi.r1y, usdngn: fx?.usdngn, inflationPct: infl?.value } : undefined,
            };
          })(),
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      setChat([...next, { role: "assistant", content: data.text || "No response." }]);
    } catch (e) {
      setChat([...next, { role: "assistant", content: `⚠ ${e.message || "Error reaching the AI service. Try again."}`, error: true }]);
    }
    setThinking(false);
  }

  const toggleCmp = (c) =>
    setCmp((p) => p.find((x) => x.t === c.t) ? p.filter((x) => x.t !== c.t) : p.length < 6 ? [...p, c] : p);

  const benchData = useMemo(
    () => benchmarks.labels.map((l, i) => ({
      d: l, NGX: benchmarks.NGX[i], SP500: benchmarks.SP500[i], NASDAQ: benchmarks.NASDAQ[i],
    })), []
  );

  const tabs = [
    ["dashboard", "Executive Summary"],
    ["company", "Company Analysis"],
    ["compare", "Comparison Center"],
    ["screener", "AI Discovery"],
    ["watchlist", "Watchlists"],
    ["benchmark", "Nigeria vs U.S."],
  ];

  return (
    <BeginnerCtx.Provider value={!advanced}>
    <div style={{
      minHeight: "100vh", background: "#000", color: "#fff",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Sora:wght@600;700;800&display=swap');
        ::-webkit-scrollbar{height:8px;width:8px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,.15);border-radius:8px}
        .glass{background:rgba(255,255,255,.04);backdrop-filter:blur(12px);border:1px solid ${BORDER}}
        .row:hover{background:rgba(255,255,255,.05)}
        @keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .g-main{display:grid;grid-template-columns:2fr 1fr;gap:14px}
        .g-half{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        .hide-sm{}
        @media (max-width: 760px){
          .g-main,.g-half{grid-template-columns:1fr}
          .hide-sm{display:none !important}
        }
      `}</style>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20, background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(14px)", borderBottom: `1px solid ${BORDER}`, padding: "14px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,${ACCENT},${BLUE})` }} />
            <div>
              <div style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 17, letterSpacing: -0.3 }}>NGX INTELLIGENCE</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.4)", letterSpacing: 1 }}>AI MARKET ANALYSIS · NIGERIAN STOCK EXCHANGE</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {asi && (
              <span title={`NGX All-Share Index · ${fmtDate(asi.asOf)}`} style={{ fontSize: 12, fontFamily: "JetBrains Mono", color: "rgba(255,255,255,0.75)" }}>
                ASI {asi.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                {asi.chg != null && <span style={{ marginLeft: 6, color: asi.chg >= 0 ? ACCENT : RED }}>{signedPct(asi.chg)}</span>}
              </span>
            )}
            {live ? (
              <span className="hide-sm" title="Live market breadth: advancers / decliners today" style={{ fontSize: 12, fontFamily: "JetBrains Mono", display: "flex", gap: 8 }}>
                <span style={{ color: ACCENT }}>▲ {breadth.up}</span>
                <span style={{ color: RED }}>▼ {breadth.down}</span>
                <span style={{ color: "rgba(255,255,255,0.4)" }}>— {breadth.flat}</span>
              </span>
            ) : (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "JetBrains Mono" }}>● loading live data…</span>
            )}
            <button onClick={() => setAdvanced(!advanced)} title={advanced ? "Switch to Beginner mode: plain-English explanations under every metric" : "Switch to Advanced mode: hide explanations"} style={{
              fontSize: 11.5, padding: "6px 12px", borderRadius: 20, cursor: "pointer",
              background: advanced ? ACCENT : "transparent", color: advanced ? "#000" : "#fff",
              border: `1px solid ${advanced ? ACCENT : BORDER}`, fontWeight: 600,
            }}>{advanced ? "Advanced mode" : "Beginner mode"}</button>
          </div>
        </div>

        {/* Global search */}
        <div style={{ position: "relative", marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.5)", border: `1px solid ${searchOpen && searchMatches.length ? ACCENT : BORDER}`, borderRadius: 10, padding: "10px 14px" }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>⌕</span>
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => { if (e.key === "Enter" && searchMatches.length) pickCompany(searchMatches[0]); if (e.key === "Escape") setSearchOpen(false); }}
              placeholder="Search companies by ticker, name, or sector…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13.5, fontFamily: "inherit" }}
            />
            {query && (
              <button onClick={() => { setQuery(""); setSearchOpen(false); }} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 14 }}>✕</button>
            )}
          </div>

          {searchOpen && query.trim() && (
            <div style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 40,
              background: "#0a0a0a", border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden",
              boxShadow: "0 16px 40px rgba(0,0,0,0.6)", maxHeight: 320, overflowY: "auto",
            }}>
              {searchMatches.length === 0 ? (
                <div style={{ padding: "14px 16px", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>No companies match "{query}"</div>
              ) : searchMatches.map((c) => (
                <div key={c.t} className="row" onMouseDown={() => pickCompany(c)} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "11px 16px", cursor: "pointer", borderBottom: `1px solid ${BORDER}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <CompanyLogo c={c} size={26} />
                    <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 13, minWidth: 92 }}>{c.t}</span>
                    <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>{c.n}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {c.sector && c.sector !== "—" && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{c.sector}</span>}
                    <span style={{ fontSize: 11.5, fontFamily: "JetBrains Mono", color: "rgba(255,255,255,0.7)" }}>₦{c.price.toLocaleString()}</span>
                    {c.rating ? (
                      <span style={{
                        fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
                        background: `${RATING_COLOR[c.rating]}22`, color: RATING_COLOR[c.rating],
                      }}>{c.rating}</span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "JetBrains Mono", color: c.chg >= 0 ? ACCENT : RED }}>{c.chg >= 0 ? "+" : ""}{c.chg}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 14, overflowX: "auto" }}>
          {tabs.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              whiteSpace: "nowrap", fontSize: 13, padding: "8px 14px", borderRadius: 8, cursor: "pointer",
              border: "none", fontWeight: 600,
              background: tab === k ? "rgba(255,255,255,0.1)" : "transparent",
              color: tab === k ? "#fff" : "rgba(255,255,255,0.45)",
            }}>{label}</button>
          ))}
        </div>
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: 10.5, color: "rgba(255,255,255,0.45)", fontFamily: "JetBrains Mono" }}>
          {feed && (
            <span>
              NGX prices as of {fmtDate(feed.tradeDate || lastRefresh)} · {feed.count} companies
              {lastRefresh && ` · refreshed ${lastRefresh.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`}
              {" · auto-updates every 5 min"}
            </span>
          )}
          {dataNote && <span style={{ color: feed ? AMBER : "rgba(255,255,255,0.45)" }}>{dataNote}</span>}
          <button onClick={refreshNow} disabled={refreshing} title="Fetch the latest prices now" style={{
            fontSize: 10.5, fontFamily: "JetBrains Mono", padding: "2px 8px", borderRadius: 6, cursor: refreshing ? "default" : "pointer",
            background: "transparent", border: `1px solid ${BORDER}`, color: refreshing ? "rgba(255,255,255,0.35)" : ACCENT,
          }}>{refreshing ? "Refreshing…" : "↻ Refresh"}</button>
        </div>
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "22px 20px 60px", animation: "fade .4s ease" }}>

        {/* ====================== DASHBOARD ====================== */}
        {tab === "dashboard" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
              {asi ? (
                <Stat label="NGX All-Share" value={asi.value} change={asi.chg ?? undefined} fmt={(v) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  sub={`${asi.live ? "Latest level" : "Close"} · ${fmtDate(asi.asOf)}`} />
              ) : (
                <Stat label="NGX All-Share" value={MARKET.asi} change={MARKET.asiChange} fmt={(v) => v.toLocaleString()} sample />
              )}
              {snap?.cap ? (
                <Stat label="Market Cap" value={snap.cap} fmt={nairaBig} sub="Equities, NGX" />
              ) : (
                <Stat label="Market Cap (₦tn)" value={MARKET.mktCap} change={MARKET.mktCapChange} fmt={(v) => v.toFixed(1)} sample />
              )}
              {live && (
                <Stat label="Market Breadth" value={breadth} change={breadth.avg} fmt={(b) => `${b.up}▲ ${b.down}▼`}
                  sub={`Avg move today across ${breadth.total} stocks`} />
              )}
              {asi ? (
                <>
                  <Stat label="ASI Year-to-Date" value={asi.ytd} fmt={signedPct} sub={asi.r1m != null ? `1 month: ${signedPct(asi.r1m)}` : undefined} />
                  <Stat label="ASI 1-Year Return" value={asi.r1y} fmt={signedPct} sub="In naira, before inflation" />
                  <Stat label="Volatility (30D)" value={asi.vol30} fmt={(v) => (v == null ? NA : `${v}%`)} sub="Annualised, daily ASI moves" />
                </>
              ) : (
                <>
                  <Gauge label="AI Opportunity" value={MARKET.opportunity} hint="Composite of value, momentum & flow signals" sample />
                  <Gauge label="Market Risk" value={MARKET.risk} invert hint="Higher = more risk. Lower score is better" sample />
                  <Gauge label="Sentiment" value={MARKET.sentiment} hint="News + announcements, last 14 days" sample />
                </>
              )}
            </div>

            <div className="g-main" style={{ marginTop: 14 }}>
              <div className="glass" style={{ borderRadius: 16, padding: 18, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>NGX All-Share Index{!asi && <SampleTag />}</div>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>
                      {asi ? `Daily close · index points · ${ASI_RANGES.find((r) => r[0] === asiRange)[1]}` : "Trailing 9 months · index points"}
                      {asi && asiChart.length > 1 && (() => {
                        const ch = pctChange(asiChart[asiChart.length - 1].v, asiChart[0].v);
                        return <span style={{ marginLeft: 8, fontFamily: "JetBrains Mono", color: ch >= 0 ? ACCENT : RED }}>{signedPct(ch)}</span>;
                      })()}
                    </div>
                  </div>
                  {asi && (
                    <div role="group" aria-label="Time range" style={{ display: "flex", gap: 4 }}>
                      {ASI_RANGES.map(([k]) => (
                        <button key={k} onClick={() => setAsiRange(k)} style={{
                          fontSize: 11, padding: "4px 9px", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontFamily: "JetBrains Mono",
                          border: `1px solid ${asiRange === k ? ACCENT : BORDER}`, background: asiRange === k ? "rgba(0,229,160,0.12)" : "transparent",
                          color: asiRange === k ? ACCENT : "rgba(255,255,255,0.55)",
                        }}>{k}</button>
                      ))}
                    </div>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={240}>
                  {asi ? (
                    <AreaChart data={asiChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ACCENT} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} stroke="rgba(255,255,255,0.3)" fontSize={11}
                        tickFormatter={(t) => fmtTick(t, asiRange)} minTickGap={28} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} domain={["auto", "auto"]} width={62}
                        tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                      <Tooltip contentStyle={tipStyle} labelFormatter={(t) => fmtDate(t)} formatter={(v) => [Number(v).toLocaleString(), "ASI"]} />
                      <Area type="linear" dataKey="v" stroke={ACCENT} strokeWidth={2} fill="url(#g)" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
                    </AreaChart>
                  ) : (
                    <AreaChart data={asiSeries}>
                      <defs>
                        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ACCENT} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="d" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} domain={["dataMin-2000", "dataMax+2000"]} />
                      <Tooltip contentStyle={tipStyle} />
                      <Area type="monotone" dataKey="v" stroke={ACCENT} strokeWidth={2} fill="url(#g)" />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>

              <div className="glass" style={{ borderRadius: 16, padding: 18 }}>
                <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Macro &amp; Market Snapshot{!market && <SampleTag />}</div>
                {(market ? [
                  ["USD / NGN", fx ? `₦${fx.usdngn.toLocaleString()}` : NA, fx ? `Daily rate · ${fmtDate(fx.updated)}` : "Unavailable"],
                  ["Inflation", infl ? `${infl.value}%` : NA, infl ? `${infl.year} annual · ${infl.source}` : "Unavailable"],
                  ["Value Traded", snap?.value ? nairaBig(snap.value) : NA, "Latest session, NGX"],
                  ["Deals", snap?.deals ? Math.round(snap.deals).toLocaleString() : NA, snap?.volume ? `${(snap.volume / 1e6).toFixed(0)}m shares` : "Latest session"],
                ] : [
                  ["Inflation", `${MARKET.inflation}%`, "Sample"],
                  ["Naira Strength", `${MARKET.naira}/100`, "Sample"],
                  ["Foreign Flow (MoM)", `${MARKET.foreignFlow}%`, "Sample"],
                  ["Economic Health", `${MARKET.econHealth}/100`, "Sample"],
                ]).map(([l, v, sub]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${BORDER}` }}>
                    <div>
                      <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.7)" }}>{l}</div>
                      <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)" }}>{sub}</div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: v === NA ? "rgba(255,255,255,0.3)" : "#fff", fontFamily: "JetBrains Mono" }}>{v}</span>
                  </div>
                ))}
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>
                  {market ? "Sources: NGX, ExchangeRate-API, World Bank. Refreshed every 15 min." : "Representative data — live feed unavailable right now."}
                </div>
              </div>
            </div>

            {/* Sector heatmap */}
            <div className="glass" style={{ borderRadius: 16, padding: 18, marginTop: 14 }}>
              <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Sector Performance Heat Map{!live && <SampleTag />}</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
                {live ? "Live · average 1-day move of listed stocks in each sector" : "Representative figures until live data loads"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8 }}>
                {(live && liveSectors.length ? liveSectors : sectors).map((s) => {
                  const pos = s.perf >= 0;
                  const intensity = Math.min(1, Math.abs(s.perf) / (live ? 2.5 : 3.5));
                  return (
                    <div key={s.name} style={{
                      borderRadius: 10, padding: "14px 12px",
                      background: pos ? `rgba(0,229,160,${0.12 + intensity * 0.5})` : `rgba(255,77,109,${0.12 + intensity * 0.5})`,
                      border: `1px solid ${BORDER}`,
                    }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: 17, fontWeight: 700, fontFamily: "JetBrains Mono", marginTop: 4 }}>
                        {pos ? "+" : ""}{s.perf}%
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>{s.count ? `${s.count} stock${s.count > 1 ? "s" : ""}` : `₦${s.cap}tn cap`}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gainers / Losers */}
            <div className="g-half" style={{ marginTop: 14 }}>
              {[["Top Gainers", true], ["Top Losers", false]].map(([title, gain]) => (
                <div key={title} className="glass" style={{ borderRadius: 16, padding: 18 }}>
                  <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{title}</div>
                  {[...companies].sort((a, b) => gain ? b.chg - a.chg : a.chg - b.chg).slice(0, 4).map((c) => (
                    <div key={c.t} className="row" onClick={() => { setSel(c); setTab("company"); }} style={{
                      display: "flex", justifyContent: "space-between", padding: "9px 8px", borderRadius: 8, cursor: "pointer",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <CompanyLogo c={c} size={24} />
                        <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 13 }}>{c.t}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{c.n}</span>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: c.chg >= 0 ? ACCENT : RED, fontFamily: "JetBrains Mono" }}>
                        {c.chg >= 0 ? "+" : ""}{c.chg}%
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

        {/* ====================== COMPANY ====================== */}
        {tab === "company" && (
          <>
            <div style={{ position: "relative", marginBottom: 12 }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", fontSize: 14 }}>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ticker, company name, or sector…"
                style={{
                  width: "100%", boxSizing: "border-box", background: "rgba(0,0,0,0.4)",
                  border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px 12px 38px",
                  color: "#fff", fontSize: 13.5, outline: "none", fontFamily: "inherit",
                }}
              />
              {search && (
                <button onClick={() => setSearch("")} style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "transparent", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 15,
                }}>✕</button>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {matches.length === 0 && (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", padding: "6px 2px" }}>
                  No companies match “{search}”.
                </div>
              )}
              {(search.trim()
                ? matches
                : [...matches].sort((a, b) => b.chg - a.chg).slice(0, 20)
              ).map((c) => (
                <button key={c.t} onClick={() => setSel(c)} style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  fontFamily: "JetBrains Mono", fontSize: 12, padding: "5px 12px 5px 6px", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${sel.t === c.t ? ACCENT : BORDER}`, fontWeight: 700,
                  background: sel.t === c.t ? "rgba(0,229,160,0.12)" : "transparent",
                  color: sel.t === c.t ? ACCENT : "rgba(255,255,255,0.6)",
                }}><CompanyLogo c={c} size={20} />{c.t}</button>
              ))}
            </div>
            {!search.trim() && matches.length > 20 && (
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>
                Showing today’s top 20 performers of {matches.length} — use the search to find any other listed company.
              </div>
            )}

            {/* Company header */}
            <div className="glass" style={{ borderRadius: 16, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <CompanyLogo c={sel} size={52} />
                <div>
                  <div style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 22 }}>{sel.n}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700, color: ACCENT, background: "rgba(0,229,160,0.1)", border: "1px solid rgba(0,229,160,0.3)", padding: "2px 8px", borderRadius: 6 }}>NGX: {sel.t}</span>
                    <span>{sel.sector}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <button onClick={(e) => {
                  const url = `${window.location.origin}${window.location.pathname}#/company/${sel.t}`;
                  const btn = e.currentTarget;
                  navigator.clipboard?.writeText(url).then(() => { btn.textContent = "Link copied ✓"; setTimeout(() => { btn.textContent = "Copy link"; }, 1600); }).catch(() => {});
                }} style={{ fontSize: 11.5, padding: "6px 12px", borderRadius: 8, cursor: "pointer", background: "transparent", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Copy link</button>
                {has(sel.rating) && (
                  <span style={{ padding: "6px 14px", borderRadius: 8, fontWeight: 700, fontSize: 13, background: `${RATING_COLOR[sel.rating]}22`, color: RATING_COLOR[sel.rating], border: `1px solid ${RATING_COLOR[sel.rating]}55` }}>AI Rating: {sel.rating}</span>
                )}
                <div style={{ textAlign: "right" }}>
                  {(() => {
                    const px = cd.price ?? sel.price;
                    const ch = cd.changePct ?? sel.chg;
                    return (
                      <>
                        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "JetBrains Mono" }}>₦{px.toLocaleString()}</div>
                        <div style={{ color: ch >= 0 ? ACCENT : RED, fontWeight: 700, fontSize: 13 }}>{ch >= 0 ? "▲" : "▼"} {Math.abs(ch)}% (1D)</div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {!sel.hasAnalytics && (
              <div style={{ marginTop: 12, fontSize: 11.5, lineHeight: 1.6, color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.3)", borderLeft: `3px solid ${BLUE}`, padding: "10px 14px", borderRadius: 6 }}>
                <strong style={{ color: BLUE }}>Live price &amp; sector are real public NGX data. </strong>
                Fundamentals and AI scores show <strong>N/A</strong> where no free public source provides them; the momentum read is computed from today’s price move.
              </div>
            )}

            {/* Live NGX price history + key stats */}
            <div className="glass" style={{ borderRadius: 16, padding: 18, marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Price — last month</div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>
                    {cd.loading ? "Loading NGX data…" : cd.error ? "NGX data unavailable right now." : `Daily close (₦) · NGX${cd.asOf ? ` · ${cd.asOf}` : ""}`}
                    {cd.history?.length > 1 && (() => {
                      const ch = pctChange(cd.history[cd.history.length - 1][1], cd.history[0][1]);
                      return <span style={{ marginLeft: 8, fontFamily: "JetBrains Mono", color: ch >= 0 ? ACCENT : RED }}>{signedPct(ch)} over period</span>;
                    })()}
                  </div>
                </div>
              </div>
              {cd.history?.length > 1 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={cd.history.map(([t, v]) => ({ t, v }))} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={BLUE} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={BLUE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="t" type="number" scale="time" domain={["dataMin", "dataMax"]} stroke="rgba(255,255,255,0.3)" fontSize={11}
                      tickFormatter={(t) => fmtTick(t, "1M")} minTickGap={28} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} domain={["auto", "auto"]} width={56} />
                    <Tooltip contentStyle={tipStyle} labelFormatter={(t) => fmtDate(t)} formatter={(v) => [`₦${Number(v).toLocaleString()}`, "Close"]} />
                    <Area type="linear" dataKey="v" stroke={BLUE} strokeWidth={2} fill="url(#gc)" dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 80, display: "flex", alignItems: "center", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                  {cd.loading ? "Loading…" : "No recent price history available."}
                </div>
              )}
            </div>

            <ProfileSection title="Market Data · NGX" note={cd.error ? "Couldn't reach NGX — showing what the live price feed has." : undefined}>
              <Metric label="Last Price" value={`₦${(cd.price ?? sel.price).toLocaleString()}`} />
              <Metric label="Market Cap" value={cd.marketCap ? nairaBig(cd.marketCap) : NA} />
              <Metric label="52-Week Range" value={cd.low52 != null && cd.high52 != null ? `₦${cd.low52}–${cd.high52}` : NA} />
              <Metric label="Day Range" value={cd.dayLow != null && cd.dayHigh != null ? `₦${cd.dayLow}–${cd.dayHigh}` : NA} />
              <Metric label="Volume" value={cd.volume != null ? countBig(cd.volume) : NA} />
              <Metric label="Value Traded" value={cd.valueTraded != null ? nairaBig(cd.valueTraded) : NA} />
              <Metric label="Shares Outstanding" value={cd.sharesOutstanding ? countBig(cd.sharesOutstanding) : NA} />
              <Metric label="Board" value={cd.board || NA} />
            </ProfileSection>

            {sel.hasAnalytics && (
              <div style={{ marginTop: 12, fontSize: 11.5, lineHeight: 1.6, color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.3)", borderLeft: `3px solid ${AMBER}`, padding: "10px 14px", borderRadius: 6 }}>
                <strong style={{ color: AMBER }}>Estimates below are illustrative. </strong>
                Ratios, growth, dividends and AI scores are sample figures — no free public source publishes NGX fundamentals. Market data above is live.
              </div>
            )}

            {has(sel.reason) && (
              <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.3)", borderLeft: `3px solid ${ACCENT}`, padding: "12px 14px", borderRadius: 6 }}>
                <strong style={{ color: ACCENT }}>Analyst view (illustrative). </strong>{sel.reason}
              </div>
            )}

            <ProfileSection title="Financial Health" sample={sel.hasAnalytics}>
              <Metric label="Financial Health" value={fmt(sel.health, "/100")} color={has(sel.health) ? (sel.health > 75 ? ACCENT : sel.health > 60 ? AMBER : RED) : undefined} />
              <Metric label="Free Cash Flow" value={fmt(sel.fcf)} />
            </ProfileSection>

            <ProfileSection title="Growth Rates" sample={sel.hasAnalytics}>
              <Metric label="Revenue Growth" value={fmt(sel.rev, "%")} color={has(sel.rev) ? (sel.rev >= 0 ? ACCENT : RED) : undefined} />
              <Metric label="EPS Growth" value={fmt(sel.eps, "%")} color={has(sel.eps) ? (sel.eps >= 0 ? ACCENT : RED) : undefined} />
            </ProfileSection>

            <ProfileSection title="Valuation Ratios" sample={sel.hasAnalytics}>
              <Metric label="P/E" value={fmt(sel.pe)} />
              <Metric label="P/B" value={fmt(sel.pb)} />
              <Metric label="ROE" value={fmt(sel.roe, "%")} />
              <Metric label="Debt / Equity" value={fmt(sel.de)} />
            </ProfileSection>

            <ProfileSection title="Dividend Performance" sample={sel.hasAnalytics}>
              <Metric label="Dividend Yield" value={fmt(sel.div, "%")} color={has(sel.div) ? ACCENT : undefined} />
            </ProfileSection>

            <ProfileSection title="Risk Scores" sample={sel.hasAnalytics}>
              <Metric label="Risk Level" value={fmt(sel.risk)} color={has(sel.risk) ? RISK_COLOR[sel.risk] : undefined} />
              <Metric label="Price Momentum (1D)" value={momentumOf(sel.chg)} color={sel.chg >= 0 ? ACCENT : RED} />
            </ProfileSection>

            <ProfileSection title="AI Scores" sample={sel.hasAnalytics} note={sel.hasAnalytics ? "⚠ Model probability estimates — not guarantees. Wide confidence around all horizons." : undefined}>
              <Metric label="AI Rating" value={fmt(sel.rating)} color={has(sel.rating) ? RATING_COLOR[sel.rating] : undefined} />
              <Metric label="Outperform · 30d" value={fmt(sel.p30, "%")} />
              <Metric label="Outperform · 90d" value={fmt(sel.p90, "%")} />
              <Metric label="Outperform · 1yr" value={fmt(sel.p1y, "%")} />
              <Metric label="Outperform · 3yr" value={fmt(sel.p3y, "%")} />
            </ProfileSection>

            {/* AI Research Assistant */}
            {(
            <div className="glass" style={{ borderRadius: 16, padding: 18, marginTop: 14 }}>
              <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                AI Research Assistant <span style={{ color: ACCENT }}>· {sel.t}</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
                Ask anything about {sel.n}. Answers are AI-generated from the data above{sel.hasAnalytics ? "" : " (live price only — fundamentals unavailable)"}.
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {["Is this company undervalued?", "What are the biggest risks?", "Good for long-term wealth building?", "How is management quality?"].map((q) => (
                  <button key={q} onClick={() => askAI(q)} disabled={thinking} style={{
                    fontSize: 11.5, padding: "6px 11px", borderRadius: 16, cursor: thinking ? "default" : "pointer",
                    background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.7)",
                  }}>{q}</button>
                ))}
              </div>

              {chat.length > 0 && (
                <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
                  {chat.map((m, i) => (
                    <div key={i} style={{
                      alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                      maxWidth: "85%", padding: "10px 13px", borderRadius: 12, fontSize: 13, lineHeight: 1.55,
                      background: m.role === "user" ? "rgba(0,229,160,0.12)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${m.role === "user" ? "rgba(0,229,160,0.3)" : BORDER}`,
                      color: m.error ? AMBER : m.role === "user" ? "#fff" : "rgba(255,255,255,0.82)", whiteSpace: "pre-wrap",
                    }}>{m.content}</div>
                  ))}
                  {thinking && <div style={{ alignSelf: "flex-start", fontSize: 12, color: "rgba(255,255,255,0.4)", padding: "4px 6px" }}>Analyzing…</div>}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && askAI(input)}
                  placeholder={`Ask about ${sel.t}…`}
                  style={{
                    flex: 1, background: "rgba(0,0,0,0.4)", border: `1px solid ${BORDER}`, borderRadius: 10,
                    padding: "11px 14px", color: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit",
                  }}
                />
                <button onClick={() => askAI(input)} disabled={thinking} style={{
                  padding: "0 18px", borderRadius: 10, border: "none", cursor: thinking ? "default" : "pointer",
                  background: ACCENT, color: "#000", fontWeight: 700, fontSize: 13,
                }}>Ask</button>
              </div>
            </div>
            )}
          </>
        )}
        {tab === "compare" && (
          <>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>
              Select up to 6 companies to compare ({cmp.length} selected)
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              {companies.filter((c) => c.hasAnalytics).map((c) => {
                const on = cmp.find((x) => x.t === c.t);
                return (
                  <button key={c.t} onClick={() => toggleCmp(c)} style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    fontFamily: "JetBrains Mono", fontSize: 12, padding: "5px 12px 5px 6px", borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${on ? ACCENT : BORDER}`, fontWeight: 700,
                    background: on ? "rgba(0,229,160,0.12)" : "transparent", color: on ? ACCENT : "rgba(255,255,255,0.6)",
                  }}><CompanyLogo c={c} size={20} />{c.t}</button>
                );
              })}
            </div>

            <div className="glass" style={{ borderRadius: 16, padding: 4, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ color: "rgba(255,255,255,0.45)" }}>
                    <th style={{ textAlign: "left", padding: "12px 14px", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>Metric</th>
                    {cmp.map((c) => (
                      <th key={c.t} style={{ padding: "12px 14px", fontFamily: "JetBrains Mono", color: "#fff", fontSize: 13 }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}><CompanyLogo c={c} size={32} />{c.t}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Price (₦)", (c) => c.price.toLocaleString()],
                    ["AI Rating", (c) => c.rating, true],
                    ["Health /100", (c) => c.health],
                    ["P/E", (c) => c.pe], ["P/B", (c) => c.pb],
                    ["ROE %", (c) => c.roe], ["Div Yield %", (c) => c.div],
                    ["Rev Growth %", (c) => c.rev], ["Risk", (c) => c.risk, false, true],
                    ["1yr Outperform %", (c) => c.p1y],
                  ].map(([label, fn, isRating, isRisk], i) => (
                    <tr key={label} style={{ borderTop: `1px solid ${BORDER}`, background: i % 2 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                      <td style={{ padding: "11px 14px", color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{label}</td>
                      {cmp.map((c) => (
                        <td key={c.t} style={{
                          padding: "11px 14px", textAlign: "center", fontFamily: "JetBrains Mono", fontWeight: 600,
                          color: isRating ? RATING_COLOR[fn(c)] : isRisk ? RISK_COLOR[fn(c)] : "#fff",
                        }}>{fn(c)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="glass" style={{ borderRadius: 16, padding: 18, marginTop: 14 }}>
              <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Valuation vs. Quality (P/E vs ROE)</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cmp.map((c) => ({ name: c.t, ROE: c.roe, PE: c.pe }))}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                  <Tooltip contentStyle={tipStyle} />
                  <Bar dataKey="ROE" fill={ACCENT} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="PE" fill={BLUE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ====================== SCREENER ====================== */}
        {tab === "screener" && (
          <>
            <div style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>AI Stock Discovery</div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", marginBottom: 16 }}>
              Filter the universe by AI-detected characteristics.
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              {[
                ["all", "All Stocks"], ["undervalued", "Undervalued"], ["growth", "High Growth"],
                ["dividend", "Dividend"], ["lowrisk", "Lower Risk"], ["momentum", "Momentum"],
              ].map(([k, label]) => (
                <button key={k} onClick={() => setScreen(k)} style={{
                  fontSize: 12.5, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 600,
                  border: `1px solid ${screen === k ? ACCENT : BORDER}`,
                  background: screen === k ? "rgba(0,229,160,0.12)" : "transparent",
                  color: screen === k ? ACCENT : "rgba(255,255,255,0.6)",
                }}>{label}</button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 12 }}>
              {screened.map((c) => (
                <div key={c.t} className="glass row" style={{ borderRadius: 14, padding: 16, cursor: "pointer" }}
                  onClick={() => { setSel(c); setTab("company"); }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <CompanyLogo c={c} size={36} />
                      <div>
                        <div style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 15 }}>{c.t}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{c.n} · {c.sector}</div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
                      background: `${RATING_COLOR[c.rating]}22`, color: RATING_COLOR[c.rating],
                    }}>{c.rating}</span>
                  </div>
                  <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 12, fontFamily: "JetBrains Mono" }}>
                    <span style={{ color: "rgba(255,255,255,0.55)" }}>P/E {c.pe}</span>
                    <span style={{ color: "rgba(255,255,255,0.55)" }}>Div {c.div}%</span>
                    <span style={{ color: c.chg >= 0 ? ACCENT : RED }}>{c.chg >= 0 ? "+" : ""}{c.chg}%</span>
                  </div>
                </div>
              ))}
              {screened.length === 0 && <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>No matches.</div>}
            </div>
          </>
        )}

        {/* ====================== WATCHLIST ====================== */}
        {tab === "watchlist" && (() => {
          const tickers = lists[activeList] || [];
          const items = companies.filter((c) => tickers.includes(c.t));
          const avgOf = (key) => {
            const vals = items.map((c) => c[key]).filter((v) => typeof v === "number");
            return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
          };
          const avgDiv = avgOf("div");
          const avgHealth = avgOf("health");
          const avgChg = avgOf("chg");
          const sectorCount = new Set(items.map((c) => c.sector).filter((x) => x && x !== "—")).size;
          const q = wlSearch.trim().toLowerCase();
          const addable = q
            ? companies.filter((c) => !tickers.includes(c.t) && (c.t.toLowerCase().includes(q) || c.n.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q))).slice(0, 25)
            : [];
          const row = (c, inList) => (
            <div key={c.t} className="row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 8px", borderRadius: 8, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, cursor: "pointer" }} onClick={() => { setSel(c); setTab("company"); }}>
                <CompanyLogo c={c} size={26} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 13 }}>{c.t}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.n}{c.sector && c.sector !== "—" ? ` · ${c.sector}` : ""}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                <span className="hide-sm" style={{ fontSize: 12, fontFamily: "JetBrains Mono", color: "rgba(255,255,255,0.7)" }}>₦{c.price.toLocaleString()}</span>
                <span style={{ fontSize: 12, fontFamily: "JetBrains Mono", color: c.chg >= 0 ? ACCENT : RED, minWidth: 52, textAlign: "right" }}>{c.chg >= 0 ? "+" : ""}{c.chg}%</span>
                <button onClick={() => toggleList(c.t)} style={{
                  fontSize: 11.5, padding: "5px 12px", borderRadius: 16, cursor: "pointer", fontWeight: 600,
                  border: `1px solid ${inList ? RED : ACCENT}`, background: "transparent", color: inList ? RED : ACCENT,
                }}>{inList ? "Remove" : "Add"}</button>
              </div>
            </div>
          );
          return (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
                {Object.keys(lists).map((name) => (
                  <button key={name} onClick={() => setActiveList(name)} style={{
                    fontSize: 12.5, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 600,
                    border: `1px solid ${activeList === name ? ACCENT : BORDER}`,
                    background: activeList === name ? "rgba(0,229,160,0.12)" : "transparent",
                    color: activeList === name ? ACCENT : "rgba(255,255,255,0.6)",
                  }}>{name} <span style={{ opacity: 0.6 }}>({(lists[name] || []).length})</span></button>
                ))}
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={newList} onChange={(e) => setNewList(e.target.value)} onKeyDown={(e) => e.key === "Enter" && createList()}
                    placeholder="New list name…" maxLength={40}
                    style={{ width: 150, background: "rgba(0,0,0,0.4)", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 12.5, outline: "none", fontFamily: "inherit" }} />
                  <button onClick={createList} disabled={!newList.trim()} style={{ fontSize: 12.5, padding: "8px 12px", borderRadius: 8, cursor: newList.trim() ? "pointer" : "default", fontWeight: 700, border: "none", background: newList.trim() ? ACCENT : "rgba(255,255,255,0.08)", color: newList.trim() ? "#000" : "rgba(255,255,255,0.4)" }}>+ Create</button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 14 }}>
                <Stat label="Holdings" value={items.length} fmt={(v) => v} />
                <Stat label="Avg Move Today" value={avgChg} fmt={(v) => (v === null ? NA : `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`)} />
                <Stat label="Avg Div Yield" value={avgDiv} fmt={(v) => (v === null ? NA : `${v.toFixed(1)}%`)} sub={avgDiv === null ? "No dividend data for these names" : undefined} />
                <Stat label="Avg Health" value={avgHealth} fmt={(v) => (v === null ? NA : `${Math.round(v)}/100`)} />
                <Stat label="Sectors" value={sectorCount} fmt={(v) => v} />
              </div>

              <div className="glass" style={{ borderRadius: 16, padding: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14 }}>{activeList}</div>
                  <button onClick={() => deleteList(activeList)} style={{ fontSize: 11.5, padding: "5px 10px", borderRadius: 8, cursor: "pointer", background: "transparent", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.5)" }}>Delete list</button>
                </div>
                {items.length === 0 && (
                  <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", padding: "6px 2px 10px" }}>No holdings yet — search below to add companies.</div>
                )}
                {items.map((c) => row(c, true))}

                <div style={{ position: "relative", marginTop: 16 }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.35)", fontSize: 14 }}>⌕</span>
                  <input value={wlSearch} onChange={(e) => setWlSearch(e.target.value)}
                    placeholder={`Add to ${activeList} — search any of ${companies.length} NGX companies…`}
                    style={{ width: "100%", boxSizing: "border-box", background: "rgba(0,0,0,0.4)", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "11px 14px 11px 38px", color: "#fff", fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                </div>
                {q && addable.length === 0 && <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", padding: "10px 2px" }}>No matches for “{wlSearch}”.</div>}
                {addable.map((c) => row(c, false))}
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>Watchlists are saved in this browser.</div>
              </div>
            </>
          );
        })()}

        {/* ====================== BENCHMARK ====================== */}
        {tab === "benchmark" && (
          <>
            <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
              <div style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 18 }}>Nigeria vs. U.S. Markets<SampleTag /></div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.5)", marginTop: 4, marginBottom: 16, maxWidth: 620, lineHeight: 1.5 }}>
                Home-country bias traps investors. The question is never "did NGX go up?" but "did it beat global alternatives after adjusting for volatility and naira depreciation?" All series rebased to 100.
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={benchData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="d" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} domain={[95, 122]} />
                  <Tooltip contentStyle={tipStyle} />
                  <ReferenceLine y={100} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="NGX" stroke={ACCENT} strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="SP500" stroke={BLUE} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="NASDAQ" stroke={AMBER} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 18, marginTop: 10, fontSize: 12 }}>
                {[["NGX All-Share", ACCENT], ["S&P 500", BLUE], ["NASDAQ", AMBER]].map(([l, c]) => (
                  <span key={l} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.6)" }}>
                    <span style={{ width: 12, height: 3, background: c, borderRadius: 2 }} /> {l}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass" style={{ borderRadius: 16, padding: 18, marginTop: 14 }}>
              <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Risk-Adjusted Reality Check</div>
              <div style={{ fontSize: 11, color: AMBER, marginBottom: 14 }}>
                The local return looks best — until you convert to USD. This is the rude, useful fact.
              </div>
              {benchmarks.table.map((r) => (
                <div key={r.idx} style={{ padding: "12px 0", borderTop: `1px solid ${BORDER}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{r.idx}</span>
                    <div style={{ display: "flex", gap: 18, fontFamily: "JetBrains Mono", fontSize: 12.5 }}>
                      <span style={{ color: ACCENT }}>Local +{r.ret}%</span>
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>Vol {r.vol}%</span>
                      <span style={{ color: r.usd >= 0 ? ACCENT : RED, fontWeight: 700 }}>USD {r.usd >= 0 ? "+" : ""}{r.usd}%</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", marginTop: 5 }}>{r.note}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", marginTop: 26, lineHeight: 1.6, textAlign: "center" }}>
          Live NGX prices, index and market data; anything tagged SAMPLE is illustrative. Not investment advice. AI ratings and probability scores are model estimates with material uncertainty, not guarantees of future returns.
        </div>
      </div>
    </div>
    </BeginnerCtx.Provider>
  );
}
