import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export type HoldingInput = { ticker: string; quantity: number; buyPrice: number };
export type InsightsInput = {
  title: string;
  holdings: HoldingInput[];
  cash: number;
  prices: Record<string, number>;
  totals: { equity: number; total: number };
};

const SYSTEM_PROMPT = `You are a financial assistant for ValueMetrix, a research platform for retail investors. You analyze portfolios and give concise, helpful insights. Always respond in valid JSON only, no markdown or extra text.

Given portfolio data (holdings with tickers, quantities, prices; cash; totals), return exactly this JSON structure:
{
  "summary": "2–3 sentence portfolio summary.",
  "diversification": "1–2 sentences on diversification (concentration vs spread).",
  "sectorExposure": "1–2 sentences on sector-wise exposure if inferable from tickers, else general note.",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "thesis": "One-liner investment thesis."
}

Use Indian stock tickers (e.g. INFY, TCS, RELIANCE) where applicable. Be brief and professional.`;

export async function generatePortfolioInsights(
  input: InsightsInput
): Promise<{
  summary: string;
  diversification: string;
  sectorExposure: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  thesis: string;
}> {
  const fallback = {
    summary: "Portfolio overview based on current holdings and cash.",
    diversification: "Diversification depends on number of holdings and sector mix.",
    sectorExposure: "Review sector allocation in your portfolio breakdown.",
    riskLevel: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH",
    thesis: "Hold a balanced mix of equity and cash; review periodically.",
  };

  if (!openai) return fallback;

  const text = JSON.stringify(
    {
      title: input.title,
      holdings: input.holdings,
      cash: input.cash,
      currentPrices: input.prices,
      equityTotal: input.totals.equity,
      totalValue: input.totals.total,
    },
    null,
    2
  );

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze this portfolio:\n\n${text}` },
      ],
      temperature: 0.3,
    });
    let raw = res.choices[0]?.message?.content?.trim();
    if (!raw) return fallback;
    const m = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) raw = m[1].trim();
    const parsed = JSON.parse(raw) as typeof fallback;
    return {
      summary: parsed.summary ?? fallback.summary,
      diversification: parsed.diversification ?? fallback.diversification,
      sectorExposure: parsed.sectorExposure ?? fallback.sectorExposure,
      riskLevel:
        parsed.riskLevel === "LOW" || parsed.riskLevel === "HIGH"
          ? parsed.riskLevel
          : "MEDIUM",
      thesis: parsed.thesis ?? fallback.thesis,
    };
  } catch {
    return fallback;
  }
}

export async function chatWithPortfolio(
  portfolioContext: string,
  userQuestion: string
): Promise<string> {
  if (!openai) {
    return "AI is not configured. Add OPENAI_API_KEY to enable Q&A.";
  }
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a financial assistant. Answer briefly based only on this portfolio context. If the question cannot be answered from it, say so.\n\nPortfolio context:\n${portfolioContext}`,
        },
        { role: "user", content: userQuestion },
      ],
      temperature: 0.3,
    });
    return res.choices[0]?.message?.content?.trim() ?? "No response.";
  } catch (e) {
    return "Sorry, I couldn't process that. Please try again.";
  }
}
