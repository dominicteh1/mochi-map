# Mochi Map

Mochi Map is an AI-powered travel planner that generates a budget-aware itinerary, lets users replan with natural language, and can export the trip plan as a PDF.

## Features

- Generate a multi-day travel itinerary from destination, budget, pace, and interests.
- Replan the trip with quick actions like rain changes or budget cuts.
- Send a custom AI request to modify the itinerary.
- Export the itinerary as a PDF.
- Pastel-themed frontend with Mochi Map branding.

## Tech Stack

### Frontend
- React
- Vite
- html2pdf.js

### Backend
- Node.js
- Express
- Google Gemini API via `@google/genai`

---

## Clone the repository

```bash
git clone https://github.com/dominicteh1/mochi-map.git
cd mochi-map
```

---

## Project structure

```bash
mochi-map/
├── frontend/
└── backend/
```

---

## Prerequisites

Make sure you have these installed:

- Node.js
- npm
- A Gemini API key from Google AI Studio

---

## Backend setup

Open a terminal and run:

```bash
cd backend
npm install
```

Create your local environment file:

```bash
cp .env.example .env
```

Then open `backend/.env` and set it like this:

```env
PORT=3001
GEMINI_API_KEY=your_real_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
FRONTEND_ORIGIN=http://localhost:5173
```

### Important

- `.env.example` is just a template.
- `.env` is your real local config file.
- Do **not** commit your real `.env` file.
- Keep your Gemini API key only in the backend, not in the frontend.

Start the backend server:

```bash
npm run dev
```

If your backend starts correctly, it should run on:

```bash
http://localhost:3001
```

---

## Frontend setup

Open a second terminal and run:

```bash
cd frontend
npm install
npm run dev
```

If your frontend starts correctly, it should run on:

```bash
http://localhost:5173
```

---

## How to use the app

1. Fill in the trip form with destination, dates, budget, pace, and interests.
2. Click **Generate itinerary**.
3. Use the quick action buttons to replan.
4. Type a custom request in the AI assistant box to change the plan.
5. Press **Enter** to submit the custom request.
6. Press **Shift + Enter** to add a new line.
7. Click **Export as PDF** to download the itinerary.

---

## Installed packages used in this project

### Frontend
```bash
npm install
npm install html2pdf.js
```

### Backend
```bash
npm install
npm install @google/genai
```

> In a normal cloned repo, `npm install` is usually enough if these packages are already listed in `package.json`.

---

## Environment notes

This project uses a backend API key setup.

- The frontend calls the backend.
- The backend calls Gemini.
- The backend reads `GEMINI_API_KEY` from `backend/.env`.

This keeps the API key out of client-side code.

---

## Common startup flow

From the repo root:

### Terminal 1
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### Terminal 2
```bash
cd frontend
npm install
npm run dev
```

Then open:

```bash
http://localhost:5173
```

---

## Troubleshooting

### `GEMINI_API_KEY` missing
Make sure `backend/.env` exists and contains your real API key.

### Model not found
If an older Gemini model fails, update `GEMINI_MODEL` in `backend/.env` to:

```env
GEMINI_MODEL=gemini-2.5-flash-lite
```

### Frontend image/logo not showing
Make sure the logo file is inside:

```bash
frontend/public/logo.png
```

### PDF export not working
Make sure `html2pdf.js` is installed in the frontend:

```bash
cd frontend
npm install html2pdf.js
```

---

## Demo credentials

No login is required.

