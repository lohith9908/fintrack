import { api } from "./api";
import { CalendarMonthResponse, CalendarFilterParams } from "../types/calendar.types";

export class CalendarService {
  /**
   * GET /api/calendar
   */
  public static async getMonthEvents(
    params: CalendarFilterParams = {}
  ): Promise<CalendarMonthResponse> {
    const queryParams: Record<string, string | number> = {};
    if (params.month) queryParams.month = params.month;
    if (params.year) queryParams.year = params.year;
    if (params.type && params.type !== "ALL") queryParams.type = params.type;

    const res = await api.get<{ success: boolean; message: string; data: CalendarMonthResponse }>(
      "/calendar",
      { params: queryParams }
    );
    return res.data.data;
  }
}
