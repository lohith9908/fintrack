import React from "react";
import { CalendarDaySummary, CalendarEvent } from "../../types/calendar.types";
import { formatCurrency } from "../../utils/formatters";
import { cn } from "../../utils/cn";
import { Repeat, Target, PieChart, ArrowDownRight, ArrowUpRight } from "lucide-react";

export interface CalendarGridProps {
  month: number;
  year: number;
  days: CalendarDaySummary[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  currency?: string;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  month,
  year,
  days,
  selectedDate,
  onSelectDate,
  currency = "INR",
}) => {
  // Determine starting weekday of the 1st of this month (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  // Create padding cells for preceding days from previous month
  const prevMonthDaysCount = new Date(year, month - 1, 0).getDate();
  const leadingBlankDays = Array.from({ length: firstDayOfWeek }, (_, i) => ({
    dayNumber: prevMonthDaysCount - firstDayOfWeek + i + 1,
    isCurrentMonth: false,
  }));

  const weekDayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const todayStr = new Date().toISOString().split("T")[0];

  const getEventBadge = (event: CalendarEvent) => {
    switch (event.type) {
      case "RECURRING_PAYMENT":
        return (
          <div
            key={event.id}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 truncate"
            title={`${event.title} (${event.amount ? formatCurrency(event.amount, currency) : ""})`}
          >
            <Repeat className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{event.title}</span>
          </div>
        );
      case "GOAL_DEADLINE":
        return (
          <div
            key={event.id}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 truncate"
            title={`${event.title} (${event.amount ? formatCurrency(event.amount, currency) : ""})`}
          >
            <Target className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{event.title}</span>
          </div>
        );
      case "BUDGET_PERIOD":
        return (
          <div
            key={event.id}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 truncate"
            title={`${event.title}`}
          >
            <PieChart className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">{event.title}</span>
          </div>
        );
      case "TRANSACTION":
      default: {
        const isIncome = (event.metadata as { type?: string })?.type === "INCOME";
        return (
          <div
            key={event.id}
            className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border truncate",
              isIncome
                ? "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-secondary text-foreground/80 border-border/40"
            )}
            title={`${event.title} (${event.amount ? formatCurrency(event.amount, currency) : ""})`}
          >
            {isIncome ? (
              <ArrowUpRight className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
            ) : (
              <ArrowDownRight className="h-2.5 w-2.5 text-rose-500 shrink-0" />
            )}
            <span className="truncate">{event.title}</span>
          </div>
        );
      }
    }
  };

  return (
    <div className="w-full bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
      {/* Weekday Header Row */}
      <div className="grid grid-cols-7 border-b border-border bg-secondary/40 text-center py-2.5">
        {weekDayLabels.map((day, idx) => (
          <div
            key={day}
            className={cn(
              "text-xs font-bold uppercase tracking-wider",
              idx === 0 || idx === 6 ? "text-muted-foreground/80" : "text-foreground"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-border/60 bg-muted/20">
        {/* Leading Blank Cells */}
        {leadingBlankDays.map((b, idx) => (
          <div
            key={`blank-${idx}`}
            className="min-h-[105px] sm:min-h-[120px] p-1.5 sm:p-2 bg-muted/30 opacity-40 select-none pointer-events-none"
          >
            <span className="text-xs font-semibold text-muted-foreground">{b.dayNumber}</span>
          </div>
        ))}

        {/* Current Month Active Days */}
        {days.map((day) => {
          const isToday = day.date === todayStr;
          const isSelected = day.date === selectedDate;
          const hasEvents = day.events.length > 0;

          return (
            <div
              key={day.date}
              onClick={() => onSelectDate(day.date)}
              className={cn(
                "min-h-[105px] sm:min-h-[120px] p-1.5 sm:p-2 transition-all flex flex-col justify-between cursor-pointer group hover:bg-muted/60",
                isSelected
                  ? "bg-primary/10 ring-2 ring-primary/60 ring-inset"
                  : isToday
                  ? "bg-primary/5"
                  : "bg-card"
              )}
            >
              {/* Day Header: Number and Outflow Badge */}
              <div className="flex items-center justify-between gap-1">
                <span
                  className={cn(
                    "text-xs font-bold inline-flex items-center justify-center h-6 w-6 rounded-full transition-colors",
                    isToday
                      ? "bg-primary text-primary-foreground font-extrabold shadow-2xs"
                      : isSelected
                      ? "bg-primary/20 text-primary font-extrabold"
                      : "text-foreground group-hover:text-primary"
                  )}
                >
                  {day.dayNumber}
                </span>

                {day.totalOutflow > 0 && (
                  <span className="text-[10px] font-semibold text-rose-500 font-mono hidden sm:inline-block">
                    -{formatCurrency(day.totalOutflow, currency)}
                  </span>
                )}
              </div>

              {/* Day Events Stack */}
              <div className="space-y-1 my-1 overflow-hidden">
                {day.events.slice(0, 3).map((evt) => getEventBadge(evt))}
                {day.events.length > 3 && (
                  <span className="text-[9px] font-bold text-muted-foreground block pl-1">
                    +{day.events.length - 3} more
                  </span>
                )}
              </div>

              {/* Day Footer Stats */}
              <div className="flex items-center justify-between text-[9px] text-muted-foreground pt-0.5 border-t border-border/20">
                {hasEvents ? (
                  <span>
                    {day.eventsCount} event{day.eventsCount > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                )}

                {day.totalInflow > 0 && (
                  <span className="text-emerald-500 font-semibold font-mono">
                    +{formatCurrency(day.totalInflow, currency)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
