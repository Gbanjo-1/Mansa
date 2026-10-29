// Vercel Serverless Function — AI Research Assistant.
//
// The browser can't call Anthropic directly (the API key would be exposed and
// CORS blocks it), so the frontend posts here and we call Anthropic server-side.
// Set ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment Variables.
// Optional: ANTHROPIC_MODEL to override the default model.
// After changing env vars, redeploy (or push a commit) so they take effect.

// Tried in order; a model that's retired or unavailable to the key falls through to the next.
const MODELS = [process.env.ANTHROPIC_MODEL, "claude-sonnet-4-5", "claude-haiku-4-5"].filter(Boolean);
const MAX_TURNS = 12;
const MAX_CHARS = 2000;

export default async function handler(req, res) {
  const key = process.env.ANTHROPIC_API_KEY;
  // GET = status check, so the app can tell visitors whether the assistant is live.
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ configured: !!key });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "GET or POST only" });
  if (!key) {
    return res.status(503).json({ error: "AI assistant isn't configured yet (missing ANTHROPIC_API_KEY on the server)." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const company = body.company && typeof body.company === "object" ? body.company : {};
    const messages = (Array.isArray(body.messages) ? body.messages : [])
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_TURNS)
      .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return res.status(400).json({ error: "Expected a user question." });
    }

    const system = `You are a Nigerian Stock Exchange (NGX) equity analyst. Answer in plain, concise language (under 150 words). Be balanced, mention key risks (including naira/FX risk where relevant), and never give guarantees. If a figure is "N/A" or missing, say the data isn't available rather than inventing it.

Selected company data. Fields ngxLive, priceLastMonth, pricePerformancePct and market are live NGX / market data. Fields pe, pb, roe, de, div, rev, eps, health, fcf, rating, risk and p30–p3y are illustrative estimates, not reported figures — if you rely on them, say they are estimates:
${JSON.stringify(company).slice(0, 3000)}

Always end with: "Not investment advice."`;

    let r, data;
    for (const model of MODELS) {
      r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ model, max_tokens: 700, system, messages }),
      });
      data = await r.json().catch(() => ({}));
      if (r.ok || r.status !== 404) break; // 404 = model not found → try the next one
    }
    if (!r.ok) {
      const msg = r.status === 401 ? "The server's ANTHROPIC_API_KEY was rejected — check the key in Vercel."
        : data?.error?.message || `Anthropic error ${r.status}`;
      return res.status(502).json({ error: msg });
    }
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
    res.status(200).json({ text: text || "No response." });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
}
