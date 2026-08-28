import { Request, Response, NextFunction } from "express";
import { CalendarService } from "../services/calendar.service";
import { calendarQuerySchema } from "../validators/calendar.validator";
import { ApiResponse } from "../utils/apiResponse";

export class CalendarController {
  /**
   * GET /api/calendar
   * Retrieve all calendar events and daily density summaries for a month
   */
  public static async getMonthEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || req.user?._id?.toString();
      if (!userId) {
        ApiResponse.error(res, "Authentication required", [], 401);
        return;
      }

      const parsedQuery = calendarQuerySchema.parse(req.query);
      const eventsData = await CalendarService.getMonthEvents(userId, parsedQuery);

      ApiResponse.success(res, "Calendar events retrieved successfully", eventsData);
    } catch (err) {
      next(err);
    }
  }
}
