import React from "react";
import { Link } from "react-router-dom";
import {
  CalendarDaySummary,
} from "../../types/calendar.types";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import {
  Repeat,
  Target,
  PieChart,
  Calendar as CalendarIcon,
  ChevronRight,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  X,
} from "lucide-react";
import { cn } from "../../utils/cn";

export interface CalendarEventDrawerProps {
  selectedDay: CalendarDaySummary | null;
  onClose: () => void;
  currency?: string;
}

export const CalendarEventDrawer: React.FC<CalendarEventDrawerProps> = ({
  selectedDay,
  onClose,
  currency = "INR",
}) => {
  if (!selectedDay) return null;

  const getEventIcon = (type: string) => {
    switch (type) {
      case "RECURRING_PAYMENT":
        return <Repeat className="h-4 w-4 text-amber-500" />;
      case "GOAL_DEADLINE":
        return <Target className="h-4 w-4 text-emerald-500" />;
      case "BUDGET_PERIOD":
        return <PieChart className="h-4 w-4 text-purple-500" />;
      case "TRANSACTION":
      default:
        return <CalendarIcon className="h-4 w-4 text-primary" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case "RECURRING_PAYMENT":
        return "Recurring Bill / Income";
      case "GOAL_DEADLINE":
        return "Savings Goal Deadline";
      case "BUDGET_PERIOD":
        return "Monthly Budget Allocation";
      case "TRANSACTION":
      default:
        return "Ledger Transaction";
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold text-foreground">
            {formatDate(selectedDay.date, { month: "long", day: "numeric", year: "numeric" })}
          </h3>
          <p className="text-xs text-muted-foreground">
            {selectedDay.eventsCount} planned event{selectedDay.eventsCount !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/transactions">
            <Button size="sm" variant="outline" className="h-8 text-xs font-semibold">
              <Plus className="h-3 w-3 mr-1" />
              <span>Add Transaction</span>
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Daily Cash Flow Bar */}
      {(selectedDay.totalInflow > 0 || selectedDay.totalOutflow > 0) && (
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-secondary/50 border border-border/40 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-emerald-500/10 text-emerald-500">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Day Inflow</span>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(selectedDay.totalInflow, currency)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-rose-500/10 text-rose-500">
              <ArrowDownRight className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Day Outflow</span>
              <span className="font-bold font-mono text-rose-600 dark:text-rose-400">
                -{formatCurrency(selectedDay.totalOutflow, currency)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Event Cards List */}
      {selectedDay.events.length === 0 ? (
        <div className="py-6 text-center space-y-1.5 bg-muted/20 rounded-xl border border-dashed border-border">
          <CalendarIcon className="h-6 w-6 text-muted-foreground mx-auto" />
          <p className="text-xs font-semibold text-foreground">No financial events on this day</p>
          <p className="text-[11px] text-muted-foreground">
            No recurring bills, goal targets, or logged transactions recorded.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {selectedDay.events.map((evt) => (
            <div
              key={evt.id}
              className="p-3 rounded-xl border border-border bg-card/70 hover:bg-muted/40 transition-colors flex flex-col justify-between space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-lg bg-secondary border border-border/60 shrink-0 mt-0.5">
                    {getEventIcon(evt.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{evt.title}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {getEventTypeLabel(evt.type)}
                      {evt.categoryName ? ` • ${evt.categoryName}` : ""}
                    </span>
                  </div>
                </div>

                {evt.amount !== undefined && (
                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        "text-xs font-bold font-mono",
                        evt.type === "RECURRING_PAYMENT"
                          ? "text-amber-600 dark:text-amber-400"
                          : evt.severity === "SUCCESS"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground"
                      )}
                    >
                      {formatCurrency(evt.amount, currency)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/30 text-[11px]">
                <Badge variant={evt.severity === "SUCCESS" ? "success" : evt.severity === "WARNING" ? "warning" : "secondary"} size="sm">
                  {evt.status || "Active"}
                </Badge>

                <Link to={evt.actionUrl}>
                  <Button variant="ghost" size="sm" className="h-6 text-[11px] font-semibold text-primary px-1.5">
                    <span>{evt.actionLabel}</span>
                    <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
