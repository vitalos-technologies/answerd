// Optional understanding step for Ask Answerd (Q-02). Runs only when the server has ANTHROPIC_API_KEY;
// otherwise the client stays on the scripted agent in lib/askAnswerd.ts. The key never reaches the browser.
import Anthropic from "@anthropic-ai/sdk"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import { z } from "zod"
import { LEAF_CATEGORIES } from "@/lib/categories"

const CATEGORY_IDS = LEAF_CATEGORIES.map((c) => c.id) as [string, ...string[]]

const Understanding = z.object({
  categories: z.array(z.enum(CATEGORY_IDS)).describe("Best matching service categories, most likely first; empty if none fit"),
  postcode: z.string().nullable().describe("UK postcode or outward code if the customer gave one, else null"),
  urgent: z.boolean(),
  emergency: z.enum(["gas", "life", "power", "flood"]).nullable().describe("Set when there is a gas smell, danger to life, a power cut or flooding"),
  leaking: z.boolean().nullable().describe("True or false only if the customer said whether water is leaking now"),
  offTopic: z.enum(["medical", "legal", "financial"]).nullable(),
})

const SYSTEM = `You read one message from a customer of Answerd, a UK marketplace for local services, and extract what they need.
Map the job to the closest of these category ids: ${CATEGORY_IDS.join(", ")}.
Only report a postcode the customer actually wrote. Mark emergency for gas smells or carbon monoxide (gas), sparks, fire or injury (life), power cuts (power) and flooding (flood).
Mark offTopic when the customer asks for medical, legal or financial advice.`

export function GET() {
  return Response.json({ enabled: !!process.env.ANTHROPIC_API_KEY })
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ mode: "scripted" }, { status: 501 })
  const body = (await req.json().catch(() => null)) as { text?: string } | null
  const text = body?.text?.slice(0, 1000).trim()
  if (!text) return Response.json({ error: "Missing text" }, { status: 400 })

  const client = new Anthropic()
  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 1024,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(Understanding) },
      system: SYSTEM,
      messages: [{ role: "user", content: text }],
    })
    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json({ mode: "scripted" }, { status: 422 })
    }
    const u = response.parsed_output
    return Response.json({
      mode: "claude",
      understanding: { ...u, postcode: u.postcode ?? undefined, leaking: u.leaking ?? undefined },
    })
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return Response.json({ mode: "scripted", error: "rate_limited" }, { status: 429 })
    if (error instanceof Anthropic.APIError) return Response.json({ mode: "scripted", error: `api_${error.status}` }, { status: 502 })
    return Response.json({ mode: "scripted", error: "unknown" }, { status: 500 })
  }
}
