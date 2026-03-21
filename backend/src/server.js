import "dotenv/config";
import express from "express";
import cors from "cors";
import tripsRouter from "./routes/trips.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173"
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "mochi-map-api" });
});

app.use("/api/trips", tripsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
