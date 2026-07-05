import { z } from "zod";
import { env } from "../env.js";

/** Structured-output schema the LLM must return for a raw deal blob. */
export const ExtractedDeal = z.object({
  title: z.string(),
  merchantName: z.string().nullable(),
  brand: z.string().nullable(),
  category: z.string().nullable(),
  regularPrice: z.number().nullable(),
  salePrice: z.number().nullable(),
  couponCode: z.string().nullable(),
  expiryDate: z.string().nullable(),
  confidenceScore: z.number().min(0).max(1),
});
export type ExtractedDeal = z.infer<typeof ExtractedDeal>;

/**
 * Extract structured deal data from messy text.
 * Uses OpenAI Structured Outputs in prod; a deterministic mock when
 * MOCK_EXTERNAL=true so the worker runs with no OpenAI account.
 */
export async function extractDeal(text: string): Promise<ExtractedDeal> {
  if (env.MOCK_EXTERNAL) {
    return mockExtract(text);
  }

  // Real OpenAI Structured Outputs path.
  const { default: OpenAI } = await import("openai");
  const { zodResponseFormat } = await import("openai/helpers/zod");
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  const completion = await client.beta.chat.completions.parse({
    model: env.OPENAI_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You extract structured product-deal data from messy affiliate/merchant text. " +
          "Return null for anything you cannot determine. confidenceScore reflects overall extraction certainty.",
      },
      { role: "user", content: text },
    ],
    response_format: zodResponseFormat(ExtractedDeal, "deal"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("LLM returned no structured output");
  return parsed;
}

/** Heuristic mock extractor — good enough to exercise the pipeline offline. */
function mockExtract(text: string): ExtractedDeal {
  const lower = text.toLowerCase();
  const prices = [...text.matchAll(/\$?\s?(\d{2,4}(?:\.\d{1,2})?)/g)].map((m) => Number(m[1]));
  const [salePrice = null, regularPrice = null] = prices;
  const codeMatch = text.match(/\b([A-Z0-9]{4,10})\b/);
  const merchant =
    lower.includes("amazon") ? "Amazon" :
    lower.includes("best buy") || lower.includes("bestbuy") ? "Best Buy" :
    lower.includes("walmart") ? "Walmart" :
    lower.includes("target") ? "Target" : null;
  return {
    title: text.split("\n")[0]?.slice(0, 80).trim() || "Untitled deal",
    merchantName: merchant,
    brand: null,
    category: lower.includes("headphone") || lower.includes("airpods") ? "Audio" : null,
    regularPrice: regularPrice != null && regularPrice > (salePrice ?? 0) ? regularPrice : null,
    salePrice,
    couponCode: /code|use/i.test(text) && codeMatch ? (codeMatch[1] ?? null) : null,
    expiryDate: null,
    confidenceScore: merchant && salePrice ? 0.72 : 0.4,
  };
}
