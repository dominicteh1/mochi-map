const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

function requireApiKey() {
  if (!OPENAI_API_KEY) {
    const err = new Error("Missing OPENAI_API_KEY in backend/.env");
    err.status = 500;
    throw err;
  }
}

async function chatJSON(messages) {
  requireApiKey();

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.7,
      response_format: { type: "json_object" }
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "OpenAI API request failed");
  }

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Model returned an empty response");
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new Error("Model did not return valid JSON");
  }
}

export async function generateTripPlan(input) {
  return chatJSON([
    {
      role: "developer",
      content: `
You are Travel Buddy AI.
Return ONLY valid JSON.
Create a realistic 3-day travel itinerary.

JSON shape:
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
- Keep totalEstimatedCost at or under budget when possible.
- Make the plan practical and easy to demo.
- Include exactly 3 day objects.
- Each day should have 3 to 4 items.
- Costs must be integers.
- Use the user's destination, dates, budget, pace, and interests.
`
    },
    {
      role: "user",
      content: JSON.stringify(input)
    }
  ]);
}

export async function replanTripPlan({ currentPlan, instruction }) {
  return chatJSON([
    {
      role: "developer",
      content: `
You are Travel Buddy AI.
Return ONLY valid JSON.
Update the trip plan based on the user's new instruction.

Keep the same JSON shape:
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
- Preserve as much of the original plan as reasonable.
- Apply the new instruction clearly.
- Keep the output demo-friendly and concise.
`
    },
    {
      role: "user",
      content: JSON.stringify({ currentPlan, instruction })
    }
  ]);
}
