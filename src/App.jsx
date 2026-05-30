import React, { useState, useMemo } from "react";
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

const companies = [
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

/* ============================================================ */

function Gauge({ label, value, suffix = "", invert = false, hint }) {
  const pct = Math.max(0, Math.min(100, value));
  const good = invert ? 100 - pct : pct;
  const color = good > 66 ? ACCENT : good > 40 ? AMBER : RED;
  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, letterSpacing: 0.5, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{label}</div>
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

function Stat({ label, value, change, fmt }) {
  const up = change >= 0;
  return (
    <div style={{ background: PANEL, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, letterSpacing: 0.5, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>{fmt(value)}</div>
      {change !== undefined && (
        <div style={{ fontSize: 12.5, marginTop: 4, color: up ? ACCENT : RED, fontWeight: 600 }}>
          {up ? "▲" : "▼"} {Math.abs(change)}%
        </div>
      )}
    </div>
  );
}

const tipStyle = { background: "#0a0a0a", border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 12 };

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [sel, setSel] = useState(companies[2]);
  const [cmp, setCmp] = useState([companies[2], companies[3], companies[0]]);
  const [advanced, setAdvanced] = useState(true);

  // AI Research Assistant
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

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
  const [lists, setLists] = useState({
    "Dividend Portfolio": ["GTCO", "ZENITHBANK"],
    "Growth Portfolio": ["MTNN", "BUACEMENT"],
    "Value Portfolio": ["DANGCEM"],
  });
  const [activeList, setActiveList] = useState("Dividend Portfolio");

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
  const screened = companies.filter(screens[screen]);

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
      const ctx = `You are a Nigerian Stock Exchange equity analyst. Answer in plain, concise language (under 130 words). Be balanced, mention risks, and never give guarantees.

Selected company data (representative prototype figures):
${JSON.stringify(sel)}

Always end with: "Not investment advice."`;
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: ctx,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      setChat([...next, { role: "assistant", content: text || "No response." }]);
    } catch (e) {
      setChat([...next, { role: "assistant", content: "Error reaching the AI service. Try again." }]);
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
            <span style={{ fontSize: 12, color: ACCENT, fontFamily: "JetBrains Mono" }}>● NGX ASI {MARKET.asi.toLocaleString()}</span>
            <button onClick={() => setAdvanced(!advanced)} style={{
              fontSize: 11.5, padding: "6px 12px", borderRadius: 20, cursor: "pointer",
              background: advanced ? ACCENT : "transparent", color: advanced ? "#000" : "#fff",
              border: `1px solid ${advanced ? ACCENT : BORDER}`, fontWeight: 600,
            }}>{advanced ? "Advanced" : "Beginner"}</button>
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
                    <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 13, minWidth: 92 }}>{c.t}</span>
                    <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)" }}>{c.n}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{c.sector}</span>
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
                      background: `${RATING_COLOR[c.rating]}22`, color: RATING_COLOR[c.rating],
                    }}>{c.rating}</span>
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
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "22px 20px 60px", animation: "fade .4s ease" }}>

        {/* ====================== DASHBOARD ====================== */}
        {tab === "dashboard" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
              <Stat label="NGX All-Share" value={MARKET.asi} change={MARKET.asiChange} fmt={(v) => v.toLocaleString()} />
              <Stat label="Market Cap (₦tn)" value={MARKET.mktCap} change={MARKET.mktCapChange} fmt={(v) => v.toFixed(1)} />
              <Gauge label="AI Opportunity" value={MARKET.opportunity} hint="Composite of value, momentum & flow signals" />
              <Gauge label="Market Risk" value={MARKET.risk} invert hint="Higher = more risk. Lower score is better" />
              <Gauge label="Sentiment" value={MARKET.sentiment} hint="News + announcements, last 14 days" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginTop: 14 }}>
              <div className="glass" style={{ borderRadius: 16, padding: 18 }}>
                <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>NGX All-Share Index</div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Trailing 9 months · index points</div>
                <ResponsiveContainer width="100%" height={230}>
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
                </ResponsiveContainer>
              </div>

              <div className="glass" style={{ borderRadius: 16, padding: 18 }}>
                <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Macro Snapshot</div>
                {[
                  ["Inflation", `${MARKET.inflation}%`, RED],
                  ["Naira Strength", `${MARKET.naira}/100`, AMBER],
                  ["Foreign Flow (MoM)", `${MARKET.foreignFlow}%`, RED],
                  ["Economic Health", `${MARKET.econHealth}/100`, AMBER],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.55)" }}>{l}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: c, fontFamily: "JetBrains Mono" }}>{v}</span>
                  </div>
                ))}
                <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>
                  Representative data for prototype. Wire to CBN / NGX feeds for live values.
                </div>
              </div>
            </div>

            {/* Sector heatmap */}
            <div className="glass" style={{ borderRadius: 16, padding: 18, marginTop: 14 }}>
              <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Sector Performance Heat Map</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8 }}>
                {sectors.map((s) => {
                  const pos = s.perf >= 0;
                  const intensity = Math.min(1, Math.abs(s.perf) / 3.5);
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
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>₦{s.cap}tn cap</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gainers / Losers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
              {[["Top Gainers", true], ["Top Losers", false]].map(([title, gain]) => (
                <div key={title} className="glass" style={{ borderRadius: 16, padding: 18 }}>
                  <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>{title}</div>
                  {[...companies].sort((a, b) => gain ? b.chg - a.chg : a.chg - b.chg).slice(0, 4).map((c) => (
                    <div key={c.t} className="row" onClick={() => { setSel(c); setTab("company"); }} style={{
                      display: "flex", justifyContent: "space-between", padding: "9px 8px", borderRadius: 8, cursor: "pointer",
                    }}>
                      <div>
                        <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 13 }}>{c.t}</span>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginLeft: 8 }}>{c.n}</span>
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

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {matches.length === 0 && (
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", padding: "6px 2px" }}>
                  No companies match “{search}”.
                </div>
              )}
              {matches.map((c) => (
                <button key={c.t} onClick={() => setSel(c)} style={{
                  fontFamily: "JetBrains Mono", fontSize: 12, padding: "7px 12px", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${sel.t === c.t ? ACCENT : BORDER}`, fontWeight: 700,
                  background: sel.t === c.t ? "rgba(0,229,160,0.12)" : "transparent",
                  color: sel.t === c.t ? ACCENT : "rgba(255,255,255,0.6)",
                }}>{c.t}</button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
              <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 22 }}>{sel.n}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{sel.t} · {sel.sector}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "JetBrains Mono" }}>₦{sel.price.toLocaleString()}</div>
                    <div style={{ color: sel.chg >= 0 ? ACCENT : RED, fontWeight: 700, fontSize: 13 }}>
                      {sel.chg >= 0 ? "▲" : "▼"} {Math.abs(sel.chg)}%
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <span style={{
                    padding: "6px 14px", borderRadius: 8, fontWeight: 700, fontSize: 13,
                    background: `${RATING_COLOR[sel.rating]}22`, color: RATING_COLOR[sel.rating],
                    border: `1px solid ${RATING_COLOR[sel.rating]}55`,
                  }}>AI Rating: {sel.rating}</span>
                  <span style={{
                    padding: "6px 14px", borderRadius: 8, fontWeight: 700, fontSize: 13,
                    background: `${RISK_COLOR[sel.risk]}22`, color: RISK_COLOR[sel.risk],
                    border: `1px solid ${RISK_COLOR[sel.risk]}55`,
                  }}>Risk: {sel.risk}</span>
                </div>

                <div style={{
                  marginTop: 16, fontSize: 13, lineHeight: 1.6, color: "rgba(255,255,255,0.7)",
                  background: "rgba(0,0,0,0.3)", borderLeft: `3px solid ${ACCENT}`, padding: "12px 14px", borderRadius: 6,
                }}>
                  <strong style={{ color: ACCENT }}>AI reasoning. </strong>{sel.reason}
                </div>

                {advanced && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginTop: 16 }}>
                    {[
                      ["P/E", sel.pe], ["P/B", sel.pb], ["ROE", `${sel.roe}%`],
                      ["Debt/Equity", sel.de], ["Div Yield", `${sel.div}%`], ["Rev Growth", `${sel.rev}%`],
                      ["EPS Growth", `${sel.eps}%`], ["Free Cash Flow", sel.fcf], ["Health", `${sel.health}/100`],
                    ].map(([l, v]) => (
                      <div key={l} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 12px", border: `1px solid ${BORDER}` }}>
                        <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.45)", textTransform: "uppercase" }}>{l}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "JetBrains Mono", marginTop: 3 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="glass" style={{ borderRadius: 16, padding: 18 }}>
                  <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14 }}>Financial Health</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
                    <div style={{ fontSize: 44, fontWeight: 800, fontFamily: "JetBrains Mono", color: sel.health > 75 ? ACCENT : sel.health > 60 ? AMBER : RED }}>
                      {sel.health}
                    </div>
                    <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                      Composite of profitability, liquidity, debt, cash-flow quality & growth sustainability.
                    </div>
                  </div>
                </div>

                <div className="glass" style={{ borderRadius: 16, padding: 18 }}>
                  <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Future Opportunity Engine</div>
                  <div style={{ fontSize: 10.5, color: AMBER, marginBottom: 12 }}>
                    ⚠ Model probability estimates — not guarantees. Wide confidence around all horizons.
                  </div>
                  {[["30 days", sel.p30], ["90 days", sel.p90], ["1 year", sel.p1y], ["3 years", sel.p3y]].map(([h, p]) => (
                    <div key={h} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "rgba(255,255,255,0.6)" }}>Outperform NGX · {h}</span>
                        <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700 }}>{p}%</span>
                      </div>
                      <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 4, marginTop: 4, position: "relative" }}>
                        <div style={{ width: `${p}%`, height: "100%", background: p > 60 ? ACCENT : p > 50 ? AMBER : RED, borderRadius: 4 }} />
                        {/* confidence band */}
                        <div style={{ position: "absolute", top: -2, left: `${Math.max(0, p - 12)}%`, width: "24%", height: 10, border: `1px dashed rgba(255,255,255,0.25)`, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Research Assistant */}
            <div className="glass" style={{ borderRadius: 16, padding: 18, marginTop: 14 }}>
              <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                AI Research Assistant <span style={{ color: ACCENT }}>· {sel.t}</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
                Ask anything about {sel.n}. Answers are AI-generated from the prototype data above.
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
                      color: m.role === "user" ? "#fff" : "rgba(255,255,255,0.82)", whiteSpace: "pre-wrap",
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
          </>
        )}
        {tab === "compare" && (
          <>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>
              Select up to 6 companies to compare ({cmp.length} selected)
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              {companies.map((c) => {
                const on = cmp.find((x) => x.t === c.t);
                return (
                  <button key={c.t} onClick={() => toggleCmp(c)} style={{
                    fontFamily: "JetBrains Mono", fontSize: 12, padding: "7px 12px", borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${on ? ACCENT : BORDER}`, fontWeight: 700,
                    background: on ? "rgba(0,229,160,0.12)" : "transparent", color: on ? ACCENT : "rgba(255,255,255,0.6)",
                  }}>{c.t}</button>
                );
              })}
            </div>

            <div className="glass" style={{ borderRadius: 16, padding: 4, overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ color: "rgba(255,255,255,0.45)" }}>
                    <th style={{ textAlign: "left", padding: "12px 14px", fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>Metric</th>
                    {cmp.map((c) => (
                      <th key={c.t} style={{ padding: "12px 14px", fontFamily: "JetBrains Mono", color: "#fff", fontSize: 13 }}>{c.t}</th>
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
                    <div>
                      <div style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 15 }}>{c.t}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{c.sector}</div>
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
          const items = companies.filter((c) => (lists[activeList] || []).includes(c.t));
          const avgDiv = items.length ? (items.reduce((s, c) => s + c.div, 0) / items.length).toFixed(1) : "0";
          const avgHealth = items.length ? Math.round(items.reduce((s, c) => s + c.health, 0) / items.length) : 0;
          const sectorCount = new Set(items.map((c) => c.sector)).size;
          return (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {Object.keys(lists).map((name) => (
                  <button key={name} onClick={() => setActiveList(name)} style={{
                    fontSize: 12.5, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontWeight: 600,
                    border: `1px solid ${activeList === name ? ACCENT : BORDER}`,
                    background: activeList === name ? "rgba(0,229,160,0.12)" : "transparent",
                    color: activeList === name ? ACCENT : "rgba(255,255,255,0.6)",
                  }}>{name}</button>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 14 }}>
                <Stat label="Holdings" value={items.length} fmt={(v) => v} />
                <Stat label="Avg Div Yield" value={avgDiv} fmt={(v) => `${v}%`} />
                <Stat label="Avg Health" value={avgHealth} fmt={(v) => `${v}/100`} />
                <Stat label="Sectors" value={sectorCount} fmt={(v) => v} />
              </div>

              <div className="glass" style={{ borderRadius: 16, padding: 18 }}>
                <div style={{ fontFamily: "Sora", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
                  {activeList} — add or remove holdings
                </div>
                {companies.map((c) => {
                  const inList = (lists[activeList] || []).includes(c.t);
                  return (
                    <div key={c.t} className="row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 8px", borderRadius: 8, borderBottom: `1px solid ${BORDER}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontFamily: "JetBrains Mono", fontWeight: 700, fontSize: 13, minWidth: 110 }}>{c.t}</span>
                        <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>{c.sector}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <span style={{ fontSize: 12, fontFamily: "JetBrains Mono", color: c.chg >= 0 ? ACCENT : RED }}>{c.chg >= 0 ? "+" : ""}{c.chg}%</span>
                        <button onClick={() => toggleList(c.t)} style={{
                          fontSize: 11.5, padding: "5px 12px", borderRadius: 16, cursor: "pointer", fontWeight: 600,
                          border: `1px solid ${inList ? RED : ACCENT}`, background: "transparent",
                          color: inList ? RED : ACCENT,
                        }}>{inList ? "Remove" : "Add"}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        {/* ====================== BENCHMARK ====================== */}
        {tab === "benchmark" && (
          <>
            <div className="glass" style={{ borderRadius: 16, padding: 20 }}>
              <div style={{ fontFamily: "Sora", fontWeight: 800, fontSize: 18 }}>Nigeria vs. U.S. Markets</div>
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
          Prototype with representative data. Not investment advice. AI ratings and probability scores are model estimates with material uncertainty, not guarantees of future returns.
        </div>
      </div>
    </div>
  );
}
