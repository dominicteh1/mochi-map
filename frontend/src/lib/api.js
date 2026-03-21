const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error || "Request failed");
  }

  return data;
}

export function createTrip(form) {
  return postJSON("/api/trips/plan", form);
}

export function replanTrip(payload) {
  return postJSON("/api/trips/replan", payload);
}
