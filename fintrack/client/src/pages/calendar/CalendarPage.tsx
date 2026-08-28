import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Plus,
  Repeat,
  Target,
  PieChart,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { CalendarService } from "../../services/calendar.service";
import {
  CalendarMonthResponse,
  CalendarEventType,
} from "../../types/calendar.types";
import { formatCurrency } from "../../utils/formatters";
import { getErrorMessage } from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { CalendarGrid } from "../../components/calendar/CalendarGrid";
import { CalendarEventDrawer } from "../../components/calendar/CalendarEventDrawer";
import { cn } from "../../utils/cn";

export const CalendarPage: React.FC = () => {
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [year, setYear] = useState<number>(now.getFullYear());
  const [activeType, setActiveType] = useState<"ALL" | CalendarEventType>("ALL");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [data, setData] = useState<CalendarMonthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendar = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await CalendarService.getMonthEvents({
        month,
        year,
        type: activeType,
      });
      setData(res);

      // Default select today if in current month, otherwise 1st day of month
      const todayStr = new Date().toISOString().split("T")[0];
      const hasToday = res.days.some((d) => d.date === todayStr);
      if (hasToday) {
        setSelectedDate(todayStr);
      } else if (res.days.length > 0) {
        setSelectedDate(res.days[0].date);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [month, year, activeType]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const handlePrevMonth = () => {
    if (month === 1) {
      setMonth(12);
      setYear((prev) => prev - 1);
    } else {
      setMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setMonth(1);
      setYear((prev) => prev + 1);
    } else {
      setMonth((prev) => prev + 1);
    }
  };

  const handleToday = () => {
    const current = new Date();
    setMonth(current.getMonth() + 1);
    setYear(current.getFullYear());
  };

  const monthOptions = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const yearOptions = [
    { value: "2024", label: "2024" },
    { value: "2025", label: "2025" },
    { value: "2026", label: "2026" },
    { value: "2027", label: "2027" },
    { value: "2028", label: "2028" },
  ];

  const filterTabs: Array<{ id: "ALL" | CalendarEventType; label: string; icon: React.ReactNode }> = [
    { id: "ALL", label: "All Events", icon: <CalendarIcon className="h-3.5 w-3.5" /> },
    { id: "RECURRING_PAYMENT", label: "Recurring Bills", icon: <Repeat className="h-3.5 w-3.5" /> },
    { id: "GOAL_DEADLINE", label: "Goal Deadlines", icon: <Target className="h-3.5 w-3.5" /> },
    { id: "BUDGET_PERIOD", label: "Budgets", icon: <PieChart className="h-3.5 w-3.5" /> },
    { id: "TRANSACTION", label: "Transactions", icon: <ArrowDownRight className="h-3.5 w-3.5" /> },
  ];

  const selectedDaySummary = data?.days.find((d) => d.date === selectedDate) || null;

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <CalendarIcon className="h-3 w-3" />
            <span>Phase 16 Financial Calendar</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Financial Calendar</h1>
          <p className="text-xs text-muted-foreground">
            Plan upcoming recurring bill settlements, savings milestones, budget limits, and cash flow obligations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCalendar()}
            disabled={isLoading}
            className="text-xs font-semibold"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            <span>Refresh</span>
          </Button>

          <Link to="/transactions">
            <Button size="sm" className="text-xs font-semibold">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              <span>Log Transaction</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Month Navigation & Controls Bar */}
      <div className="p-4 rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevMonth}
              className="h-9 w-9 p-0"
              title="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
              className="h-9 w-9 p-0"
              title="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="h-9 text-xs font-bold px-3 text-primary hover:text-primary"
          >
            Today
          </Button>

          <div className="flex items-center gap-2 pl-2">
            <Select
              value={String(month)}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              options={monthOptions}
              className="h-9 text-xs font-bold min-w-[120px]"
            />
            <Select
              value={String(year)}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              options={yearOptions}
              className="h-9 text-xs font-bold min-w-[90px]"
            />
          </div>
        </div>

        {/* Filter Type Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveType(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5",
                activeType === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-32" />
              </Card>
            ))}
          </div>
          <Skeleton className="h-[480px] w-full rounded-2xl" />
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load financial calendar"
          message={error}
          onRetry={fetchCalendar}
        />
      ) : !data ? (
        <ErrorState
          title="Calendar data not found"
          message="No calendar information available for this period."
          onRetry={fetchCalendar}
        />
      ) : (
        <div className="space-y-6">
          {/* Summary Mini-Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 bg-card/80 space-y-1 border-border/80">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Projected Outflows</span>
                <Repeat className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-xl font-bold font-mono text-foreground">
                {formatCurrency(data.summary.totalProjectedBills)}
              </p>
              <span className="text-[10px] text-muted-foreground">Recurring bills due this month</span>
            </Card>

            <Card className="p-4 bg-card/80 space-y-1 border-border/80">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Projected Inflows</span>
                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-xl font-bold font-mono text-foreground">
                {formatCurrency(data.summary.totalProjectedIncome)}
              </p>
              <span className="text-[10px] text-muted-foreground">Scheduled income streams</span>
            </Card>

            <Card className="p-4 bg-card/80 space-y-1 border-border/80">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Goal Deadlines</span>
                <Target className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-xl font-bold font-mono text-foreground">
                {data.summary.goalDeadlinesCount}
              </p>
              <span className="text-[10px] text-muted-foreground">Savings milestones maturing</span>
            </Card>

            <Card className="p-4 bg-card/80 space-y-1 border-border/80">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-semibold">Active Budgets</span>
                <PieChart className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-xl font-bold font-mono text-foreground">
                {data.summary.activeBudgetsCount}
              </p>
              <span className="text-[10px] text-muted-foreground">Monthly expense limits active</span>
            </Card>
          </div>

          {/* Calendar Grid & Event Detail Drawer Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Calendar Grid Viewport */}
            <div className="lg:col-span-2 space-y-4">
              <CalendarGrid
                month={month}
                year={year}
                days={data.days}
                selectedDate={selectedDate}
                onSelectDate={(d) => setSelectedDate(d)}
              />
            </div>

            {/* Selected Date Detail Drawer */}
            <div className="lg:col-span-1 space-y-4">
              <CalendarEventDrawer
                selectedDay={selectedDaySummary}
                onClose={() => setSelectedDate(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
