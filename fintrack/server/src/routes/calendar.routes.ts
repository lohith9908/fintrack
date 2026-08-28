import { Router } from "express";
import { CalendarController } from "../controllers/calendar.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const calendarRouter = Router();

// Enforce authentication across all calendar routes
calendarRouter.use(requireAuth);

/**
 * @route   GET /api/calendar
 * @desc    Get aggregated financial events and daily density summary for a given month
 * @access  Private
 */
calendarRouter.get("/", CalendarController.getMonthEvents);
