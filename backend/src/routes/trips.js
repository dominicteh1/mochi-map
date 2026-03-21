import { Router } from "express";
import { generateTripPlan, replanTripPlan } from "../services/gemini.js";

const router = Router();

router.post("/plan", async (req, res, next) => {
  try {
    const { destination, startDate, endDate, budget, pace, interests } = req.body;

    if (!destination || !budget) {
      return res.status(400).json({ error: "destination and budget are required" });
    }

    const result = await generateTripPlan({
      destination,
      startDate,
      endDate,
      budget,
      pace,
      interests
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/replan", async (req, res, next) => {
  try {
    const { currentPlan, instruction } = req.body;

    if (!currentPlan || !instruction) {
      return res.status(400).json({ error: "currentPlan and instruction are required" });
    }

    const result = await replanTripPlan({ currentPlan, instruction });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
