export type CalendarEventType =
  | "RECURRING_PAYMENT"
  | "GOAL_DEADLINE"
  | "BUDGET_PERIOD"
  | "TRANSACTION";

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string; // YYYY-MM-DD
  amount?: number;
  currency?: string;
  status?: string;
  severity?: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
  categoryName?: string;
  accountName?: string;
  metadata?: Record<string, unknown>;
  actionUrl: string;
  actionLabel: string;
}

export interface CalendarDaySummary {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  totalInflow: number;
  totalOutflow: number;
  eventsCount: number;
  events: CalendarEvent[];
}

export interface CalendarMonthResponse {
  month: number;
  year: number;
  monthLabel: string;
  events: CalendarEvent[];
  days: CalendarDaySummary[];
  summary: {
    totalProjectedBills: number;
    totalProjectedIncome: number;
    goalDeadlinesCount: number;
    activeBudgetsCount: number;
    recordedTransactionsCount: number;
  };
}

export interface CalendarFilterParams {
  month?: number;
  year?: number;
  type?: "ALL" | CalendarEventType;
}
