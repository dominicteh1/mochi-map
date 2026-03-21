import { useRef, useState } from "react";
import html2pdf from "html2pdf.js";
import { createTrip, replanTrip } from "./lib/api";

const starterMessages = [
  {
    role: "assistant",
    text: "Hi! I’m your AI Travel Buddy. Tell me your destination, budget, and vibe, and I’ll build a plan."
  }
];

function formatDisplayDate(dateString) {
  if (!dateString) return "";

  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export default function App() {
  const itineraryRef = useRef(null);

  const [form, setForm] = useState({
    destination: "Tokyo",
    startDate: "2026-04-10",
    endDate: "2026-04-13",
    budget: "600",
    pace: "Balanced",
    interests: "food, anime, temples"
  });

  const [messages, setMessages] = useState(starterMessages);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  const itinerary = plan?.itinerary || [];
  const totalTripCost =
    plan?.summary?.totalEstimatedCost ||
    itinerary.reduce((sum, day) => sum + (day.total || 0), 0);

  const budgetValue = Math.max(Number(form.budget || 0), 1);
  const budgetUsedPercent = Math.min(
    Math.round((totalTripCost / budgetValue) * 100),
    100
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleExportPDF = () => {
    if (!itineraryRef.current || !plan) return;

    const options = {
      margin: 10,
      filename: `mochi-map-${form.destination
        .toLowerCase()
        .replace(/\s+/g, "-")}-trip.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    html2pdf().set(options).from(itineraryRef.current).save();
  };

  const generateTrip = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await createTrip({
        ...form,
        budget: Number(form.budget)
      });

      setPlan(result);
      setMessages([
        {
          role: "assistant",
          text: result.assistantMessage || "Your itinerary is ready."
        }
      ]);
    } catch (err) {
      setError(err.message || "Failed to generate trip.");
    } finally {
      setLoading(false);
    }
  };

  const runReplan = async (instruction, userMessage, nextPlanOverride = null) => {
    if (!plan) return;

    setLoading(true);
    setError("");

    try {
      const currentPlan = nextPlanOverride || plan;

      const result = await replanTrip({
        currentPlan,
        instruction
      });

      setPlan(result);
      setMessages((prev) => [
        ...prev,
        { role: "user", text: userMessage },
        {
          role: "assistant",
          text: result.assistantMessage || "I updated your trip."
        }
      ]);
    } catch (err) {
      setError(err.message || "Failed to replan trip.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomReplan = async (e) => {
    e.preventDefault();

    const trimmedPrompt = customPrompt.trim();
    if (!trimmedPrompt || !plan) return;

    await runReplan(trimmedPrompt, trimmedPrompt);
    setCustomPrompt("");
  };

  const handleAssistantKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.form?.requestSubmit();
    }
  };

  const replanForRain = async () => {
    await runReplan(
      "It is raining on day 2. Replace outdoor stops with indoor alternatives and keep the itinerary practical, realistic, and budget-aware.",
      "It’s raining on day 2. Replan my trip."
    );
  };

  const cutBudget = async () => {
    if (!plan) return;

    const nextBudget = Math.max(Number(form.budget) - 100, 100);
    const nextForm = { ...form, budget: String(nextBudget) };
    setForm(nextForm);

    const nextPlan = {
      ...plan,
      summary: {
        ...plan.summary,
        budget: nextBudget
      }
    };

    await runReplan(
      `Reduce the total trip budget to $${nextBudget}. Keep the best parts of the trip, swap expensive items for cheaper alternatives, and stay practical.`,
      "Cut my budget by $100.",
      nextPlan
    );
  };

  const cheaperFood = async () => {
    await runReplan(
      "Find cheaper food options across the itinerary while keeping them highly rated and close to the planned stops.",
      "Find cheaper food options."
    );
  };

  const relaxDayOne = async () => {
    await runReplan(
      "Make day 1 more relaxed by removing one stop, adding more buffer time, and keeping the day enjoyable and realistic.",
      "Make day 1 more relaxed."
    );
  };

  return (
    <div className="page">
      <header className="hero">
        <div>
          <div className="title-row">
            <img src="/logo.png" alt="Mochi Map logo" className="logo-img" />
            <div className="title-block">
              <p className="eyebrow">Hackathon Demo</p>
              <h1>Mochi Map</h1>
            </div>
          </div>

          <p className="hero-text">
            Plan a trip, stay on budget, and replan instantly when weather or
            costs change.
          </p>

          <div className="hero-pills">
            <span>Conversational planning</span>
            <span>Budget-aware itinerary</span>
            <span>Live trip replanning</span>
          </div>
        </div>

        <div className="hero-card">
          <h3>Trip Snapshot</h3>
          <div className="snapshot-row">
            <span>Destination</span>
            <strong>{form.destination}</strong>
          </div>
          <div className="snapshot-row">
            <span>Dates</span>
            <strong>
              {formatDisplayDate(form.startDate)} -{" "}
              {formatDisplayDate(form.endDate)}
            </strong>
          </div>
          <div className="snapshot-row">
            <span>Budget</span>
            <strong>${form.budget}</strong>
          </div>
          <div className="snapshot-row">
            <span>Pace</span>
            <strong>{form.pace}</strong>
          </div>
        </div>
      </header>

      <main className="grid">
        <div className="left-column">
          <section className="panel form-panel">
            <div className="panel-header">
              <h2>Create your trip</h2>
              <p>Fill in the basics and generate a travel plan.</p>
            </div>

            <form onSubmit={generateTrip} className="trip-form">
              <label>
                Destination
                <input
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  placeholder="Tokyo"
                />
              </label>

              <div className="two-col">
                <label>
                  Start date
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  End date
                  <input
                    type="date"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <div className="two-col">
                <label>
                  Budget
                  <input
                    type="number"
                    name="budget"
                    value={form.budget}
                    onChange={handleChange}
                    placeholder="600"
                  />
                </label>

                <label>
                  Pace
                  <select name="pace" value={form.pace} onChange={handleChange}>
                    <option>Relaxed</option>
                    <option>Balanced</option>
                    <option>Fast-paced</option>
                  </select>
                </label>
              </div>

              <label>
                Interests
                <input
                  name="interests"
                  value={form.interests}
                  onChange={handleChange}
                  placeholder="food, nightlife, art"
                />
              </label>

              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? "Generating..." : "Generate itinerary"}
              </button>

              {loading && <p className="status-text">Thinking...</p>}
              {error && <p className="error-text">{error}</p>}
            </form>
          </section>

          <section className="panel itinerary-panel">
            <div className="panel-header">
              <h2>Suggested itinerary</h2>
              <p>
                {plan
                  ? "A day-by-day plan generated from user constraints."
                  : "Generate a trip to see your itinerary."}
              </p>
            </div>

            <div className="chat-actions export-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={handleExportPDF}
                disabled={!plan || loading}
              >
                Export as PDF
              </button>
            </div>

            <div ref={itineraryRef}>
              <div className="days">
                {itinerary.map((day) => (
                  <article key={day.day} className="day-card">
                    <div className="day-top">
                      <div>
                        <p className="day-label">{day.day}</p>
                        <h3>{day.theme}</h3>
                      </div>
                      <span className="day-total">${day.total}</span>
                    </div>

                    <p className="budget-hint">{day.budgetHint}</p>

                    <div className="timeline">
                      {day.items?.map((item, index) => (
                        <div key={index} className="timeline-item">
                          <div className="timeline-time">{item.time}</div>
                          <div>
                            <h4>{item.title}</h4>
                            <p>{item.desc}</p>
                          </div>
                          <div className="timeline-cost">${item.cost}</div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="right-column">
          <section className="panel budget-panel">
            <div className="panel-header">
              <h2>Budget view</h2>
              <p>A quick summary for the demo.</p>
            </div>

            <div className="budget-total">
              <span>Estimated total</span>
              <strong>${totalTripCost}</strong>
            </div>

            <div className="progress-wrap">
              <div className="progress-label">
                <span>Budget used</span>
                <span>{budgetUsedPercent}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${budgetUsedPercent}%` }}
                />
              </div>
            </div>

            <div className="quick-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={replanForRain}
                disabled={!plan || loading}
              >
                Replan for rain
              </button>
              <button
                type="button"
                className="secondary-btn"
                onClick={cutBudget}
                disabled={!plan || loading}
              >
                Cut budget by $100
              </button>
            </div>
          </section>

          <section className="panel chat-panel">
            <div className="panel-header">
              <h2>AI assistant</h2>
            </div>

            <div className="chat-box">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${
                    msg.role === "assistant" ? "assistant" : "user"
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <form onSubmit={handleCustomReplan} className="assistant-form">
              <textarea
                className="assistant-input"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={handleAssistantKeyDown}
                placeholder="Ask the AI to change your plan, like: Make day 2 more food-focused and keep it under $50."
                rows={4}
                disabled={!plan || loading}
              />
              <button
                type="submit"
                className="secondary-btn"
                disabled={!plan || loading || !customPrompt.trim()}
              >
                Send custom request
              </button>
            </form>

            <div className="chat-actions">
              <button
                type="button"
                className="ghost-btn"
                onClick={cheaperFood}
                disabled={!plan || loading}
              >
                Cheaper food
              </button>

              <button
                type="button"
                className="ghost-btn"
                onClick={relaxDayOne}
                disabled={!plan || loading}
              >
                Relax day 1
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
