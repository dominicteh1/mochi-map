import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

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

async function generateJSON(prompt, payload) {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: `${prompt}

Input JSON:
${JSON.stringify(payload, null, 2)}`
  });

  const text = extractText(response);
  return parseJSON(text);
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
- Do not include markdown fences.`,
    { currentPlan, instruction }
  );
}
