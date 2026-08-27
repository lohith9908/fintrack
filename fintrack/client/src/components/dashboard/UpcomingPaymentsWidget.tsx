import React from "react";
import { Link } from "react-router-dom";
import { RecurringPaymentItem } from "../../types/dashboard.types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from "../ui";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { CalendarClock, ArrowRight } from "lucide-react";

export interface UpcomingPaymentsWidgetProps {
  payments: RecurringPaymentItem[];
  currency?: string;
}

export const UpcomingPaymentsWidget: React.FC<UpcomingPaymentsWidgetProps> = ({
  payments,
  currency = "INR",
}) => {
  return (
    <Card className="border border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold">Upcoming Recurring</CardTitle>
            <span className="p-1 rounded-md bg-warning/10 text-warning">
              <CalendarClock className="h-3.5 w-3.5" />
            </span>
          </div>
          <CardDescription className="text-xs">
            Scheduled automatic & recurring subscriptions
          </CardDescription>
        </div>
        <Link
          to="/recurring"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <span>All Schedules</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 space-y-2.5 text-xs">
        {payments.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground space-y-2">
            <p>No upcoming recurring payments scheduled.</p>
            <Link to="/recurring" className="text-primary font-semibold hover:underline block text-xs">
              + Add Recurring Rule
            </Link>
          </div>
        ) : (
          payments.map((p) => {
            const isIncome = p.type === "INCOME";

            return (
              <div
                key={p._id}
                className="p-3 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/40 transition-colors flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-foreground">
                      {p.description}
                    </span>
                    <Badge variant="secondary" size="sm" className="text-[10px]">
                      {p.frequency}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Due: {formatDate(p.nextDueDate)} {p.accountName ? `• ${p.accountName}` : ""}
                  </p>
                </div>

                <div
                  className={`text-right font-extrabold ${
                    isIncome ? "text-emerald-500" : "text-foreground"
                  }`}
                >
                  {isIncome ? "+" : "-"}
                  {formatCurrency(p.amount, currency)}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
