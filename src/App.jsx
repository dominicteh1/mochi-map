import { useMemo, useState } from "react";

const starterMessages = [
  {
    role: "assistant",
    text: "Hi! I’m your AI Travel Buddy. Tell me your destination, budget, and vibe, and I’ll build a plan."
  }
];

function buildPlan(form) {
  const dailyBudget = Math.max(Math.floor(Number(form.budget || 0) / 3), 80);

  return [
    {
      day: "Day 1",
      theme: "Arrival + City Highlights",
      items: [
        {
          time: "9:00 AM",
          title: `Check in and explore central ${form.destination || "the city"}`,
          desc: "Start with a walkable area so the first day feels easy and flexible.",
          cost: 20
        },
        {
          time: "12:30 PM",
          title: "Local lunch spot",
          desc: `Pick a casual place matching your interests: ${form.interests || "food, culture, and sightseeing"}.`,
          cost: 25
        },
        {
          time: "3:00 PM",
          title: "Top landmark visit",
          desc: "Choose one must-see attraction instead of overpacking the first day.",
          cost: 30
        },
        {
          time: "7:30 PM",
          title: "Dinner + evening walk",
          desc: "End with a relaxed neighborhood dinner and scenic nighttime view.",
          cost: 35
        }
      ]
    },
    {
      day: "Day 2",
      theme: `${form.pace || "Balanced"} exploration`,
      items: [
        {
          time: "10:00 AM",
          title: "Neighborhood exploration",
          desc: "Spend the morning in a district aligned with your travel style.",
          cost: 15
        },
        {
          time: "1:00 PM",
          title: "Signature experience",
          desc: "Book one memorable activity rather than multiple rushed ones.",
          cost: 50
        },
        {
          time: "4:00 PM",
          title: "Cafe or recharge break",
          desc: "Built-in buffer time for rest, photos, or weather changes.",
          cost: 15
        },
        {
          time: "8:00 PM",
          title: "Dinner reservation",
          desc: "Recommended based on your budget and interests.",
          cost: 40
        }
      ]
    },
    {
      day: "Day 3",
      theme: "Flexible finish",
      items: [
        {
          time: "9:30 AM",
          title: "Brunch + souvenirs",
          desc: "Keep the last morning easy so departures stay low-stress.",
          cost: 25
        },
        {
          time: "12:00 PM",
          title: "Optional museum or market",
          desc: "A final stop based on weather and remaining budget.",
          cost: 20
        },
        {
          time: "3:00 PM",
          title: "Transit to airport or next stop",
          desc: "Includes a time buffer for realistic travel planning.",
          cost: 20
        }
      ]
    }
  ].map((day) => ({
    ...day,
    total: day.items.reduce((sum, item) => sum + item.cost, 0),
    budgetHint: `Suggested daily spend: about $${dailyBudget}`
  }));
}

export default function App() {
  const [form, setForm] = useState({
    destination: "Tokyo",
    startDate: "2026-04-10",
    endDate: "2026-04-13",
    budget: "600",
    pace: "Balanced",
    interests: "food, anime, temples"
  });

  const [messages, setMessages] = useState(starterMessages);
  const [weatherMode, setWeatherMode] = useState(false);
  const [planned, setPlanned] = useState(true);

  const plan = useMemo(() => buildPlan(form), [form]);

  const totalTripCost = useMemo(
    () => plan.reduce((sum, day) => sum + day.total, 0),
    [plan]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const generateTrip = (e) => {
    e.preventDefault();
    setPlanned(true);
    setMessages([
      {
        role: "assistant",
        text: `Got it — I created a ${form.pace.toLowerCase()} trip for ${form.destination} focused on ${form.interests}.`
      }
    ]);
  };

  const replanForRain = () => {
    setWeatherMode(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: "It’s raining on day 2. Replan my trip." },
      {
        role: "assistant",
        text: "Done — I swapped outdoor items for indoor cafes, museums, and covered markets."
      }
    ]);
  };

  const cutBudget = () => {
    const nextBudget = Math.max(Number(form.budget) - 100, 100);
    setForm((prev) => ({ ...prev, budget: String(nextBudget) }));
    setMessages((prev) => [
      ...prev,
      { role: "user", text: "Cut my budget by $100." },
      {
        role: "assistant",
        text: `Updated — I reduced premium activities and adjusted food recommendations to fit a $${nextBudget} budget.`
      }
    ]);
  };

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Hackathon Demo</p>
          <h1>Travel Buddy AI</h1>
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
              {form.startDate} to {form.endDate}
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

            <button className="primary-btn" type="submit">
              Generate itinerary
            </button>
          </form>
        </section>

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
              <span>{Math.min(Math.round((totalTripCost / Number(form.budget || 1)) * 100), 100)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(
                    (totalTripCost / Number(form.budget || 1)) * 100,
                    100
                  )}%`
                }}
              />
            </div>
          </div>

          <div className="quick-actions">
            <button className="secondary-btn" onClick={replanForRain}>
              Replan for rain
            </button>
            <button className="secondary-btn" onClick={cutBudget}>
              Cut budget by $100
            </button>
          </div>
        </section>

        <section className="panel itinerary-panel">
          <div className="panel-header">
            <h2>Suggested itinerary</h2>
            <p>
              {planned
                ? "A day-by-day plan generated from user constraints."
                : "No itinerary yet."}
            </p>
          </div>

          <div className="days">
            {plan.map((day) => (
              <article key={day.day} className="day-card">
                <div className="day-top">
                  <div>
                    <p className="day-label">{day.day}</p>
                    <h3>{weatherMode && day.day === "Day 2" ? "Rain-friendly indoor plan" : day.theme}</h3>
                  </div>
                  <span className="day-total">${day.total}</span>
                </div>

                <p className="budget-hint">{day.budgetHint}</p>

                <div className="timeline">
                  {day.items.map((item, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-time">{item.time}</div>
                      <div>
                        <h4>{item.title}</h4>
                        <p>
                          {weatherMode && day.day === "Day 2" && index === 1
                            ? "Indoor alternative selected based on weather conditions."
                            : item.desc}
                        </p>
                      </div>
                      <div className="timeline-cost">${item.cost}</div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel chat-panel">
          <div className="panel-header">
            <h2>AI assistant</h2>
            <p>Show this during the demo to make the product feel interactive.</p>
          </div>

          <div className="chat-box">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.role === "assistant" ? "assistant" : "user"}`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="chat-actions">
            <button
              className="ghost-btn"
              onClick={() =>
                setMessages((prev) => [
                  ...prev,
                  { role: "user", text: "Find cheaper food options." },
                  {
                    role: "assistant",
                    text: "I replaced two restaurant picks with highly rated budget spots near your itinerary."
                  }
                ])
              }
            >
              Cheaper food
            </button>

            <button
              className="ghost-btn"
              onClick={() =>
                setMessages((prev) => [
                  ...prev,
                  { role: "user", text: "Make day 1 more relaxed." },
                  {
                    role: "assistant",
                    text: "Done — I removed one stop and added a longer afternoon break."
                  }
                ])
              }
            >
              Relax day 1
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
