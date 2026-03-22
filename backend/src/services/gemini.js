import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const DEFAULT_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview";

const FALLBACK_MODELS = (
  process.env.GEMINI_FALLBACK_MODELS ||
  "gemini-3-flash-preview,gemini-2.5-flash-lite"
)
  .split(",")
  .map((model) => model.trim())
  .filter(Boolean);

const MODEL_CHAIN = [DEFAULT_MODEL, ...FALLBACK_MODELS];

function requireApiKey() {
  if (!GEMINI_API_KEY) {
    const err = new Error("Missing GEMINI_API_KEY in backend/.env");
    err.status = 500;
    throw err;
  }
}

function getClient() {
  requireApiKey();
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

function extractText(response) {
  if (typeof response?.text === "string" && response.text.trim()) {
    return response.text.trim();
  }

  const parts = response?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((part) => part?.text || "").join("").trim();

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}

function parseJSON(text) {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error("Gemini did not return valid JSON");
  }
}

function shouldTryFallback(error) {
  const code =
    error?.status ||
    error?.code ||
    error?.response?.status ||
    error?.cause?.status;

  const message = String(error?.message || "").toLowerCase();

  return (
    code === 429 ||
    code === 500 ||
    code === 503 ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("resource_exhausted") ||
    message.includes("unavailable") ||
    message.includes("overloaded") ||
    message.includes("high demand")
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateJSON(prompt, payload) {
  const ai = getClient();

  const contents = `${prompt}

Input JSON:
${JSON.stringify(payload, null, 2)}`;

  let lastError;

  for (let i = 0; i < MODEL_CHAIN.length; i++) {
    const model = MODEL_CHAIN[i];

    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const text = extractText(response);
      const parsed = parseJSON(text);

      return {
        ...parsed,
        modelUsed: model,
      };
    } catch (error) {
      lastError = error;

      if (!shouldTryFallback(error) || i === MODEL_CHAIN.length - 1) {
        break;
      }

      await sleep(800);
    }
  }

  throw lastError;
}

export async function generateTripPlan(input) {
  return generateJSON(
    `You are Mochi Map AI.
Return ONLY valid JSON.
Create a realistic 3-day travel itinerary.

Use exactly this JSON shape:
{
  "assistantMessage": "string",
  "summary": {
    "destination": "string",
    "budget": number,
    "pace": "string",
    "interests": ["string"],
    "totalEstimatedCost": number
  },
  "itinerary": [
    {
      "day": "Day 1",
      "theme": "string",
      "budgetHint": "string",
      "total": number,
      "items": [
        {
          "time": "9:00 AM",
          "title": "string",
          "desc": "string",
          "cost": number
        }
      ]
    }
  ]
}

Rules:
- Include exactly 3 day objects.
- Each day should have 3 to 4 items.
- Costs must be integers.
- Keep the trip practical and demo-friendly.
- Keep totalEstimatedCost at or under budget when reasonably possible.
- Use the user's destination, dates, budget, pace, and interests.
- Group places that are geographically near each other into the same day when possible.
- Order each day in a practical sequence that minimizes unnecessary travel.
- Do not include markdown fences.`,
    input
  );
}

export async function replanTripPlan({ currentPlan, instruction }) {
  return generateJSON(
    `You are Mochi Map AI.
Return ONLY valid JSON.
Update the trip plan based on the new instruction.

Use exactly this JSON shape:
{
  "assistantMessage": "string",
  "summary": {
    "destination": "string",
    "budget": number,
    "pace": "string",
    "interests": ["string"],
    "totalEstimatedCost": number
  },
  "itinerary": [
    {
      "day": "Day 1",
      "theme": "string",
      "budgetHint": "string",
      "total": number,
      "items": [
        {
          "time": "9:00 AM",
          "title": "string",
          "desc": "string",
          "cost": number
        }
      ]
    }
  ]
}

Rules:
- Preserve as much of the current plan as reasonable.
- Apply the instruction clearly.
- Keep the result concise, practical, and budget-aware.
- Keep places near each other on the same day when possible.
- Maintain a practical order within each day to reduce unnecessary travel.
- Do not include markdown fences.`,
    { currentPlan, instruction }
  );
}
