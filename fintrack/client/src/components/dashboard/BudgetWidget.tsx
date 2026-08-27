import React from "react";
import { Link } from "react-router-dom";
import { BudgetStatusItem } from "../../types/dashboard.types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Progress,
  Badge,
} from "../ui";
import { formatCurrency } from "../../utils/formatters";
import { AlertCircle, Target, ArrowRight } from "lucide-react";

export interface BudgetWidgetProps {
  budgets: BudgetStatusItem[];
  currency?: string;
}

export const BudgetWidget: React.FC<BudgetWidgetProps> = ({
  budgets,
  currency = "INR",
}) => {
  return (
    <Card className="border border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold">Monthly Budgets</CardTitle>
            <span className="p-1 rounded-md bg-primary/10 text-primary">
              <Target className="h-3.5 w-3.5" />
            </span>
          </div>
          <CardDescription className="text-xs">
            Spending thresholds for the current month
          </CardDescription>
        </div>
        <Link
          to="/budgets"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <span>All Budgets</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 space-y-3.5 text-xs">
        {budgets.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground space-y-2">
            <p>No active category budgets set for this month.</p>
            <Link to="/budgets" className="text-primary font-semibold hover:underline block text-xs">
              + Set Up Monthly Budget
            </Link>
          </div>
        ) : (
          budgets.map((b) => {
            const isWarning = b.percentage >= 80 && !b.isExceeded;

            return (
              <div
                key={b._id}
                className="p-3 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/40 transition-colors space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: b.categoryColor || "#3B82F6" }}
                    />
                    <span className="font-bold text-foreground">
                      {b.categoryName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {b.isExceeded ? (
                      <Badge variant="danger" size="sm" className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>Exceeded</span>
                      </Badge>
                    ) : isWarning ? (
                      <Badge variant="warning" size="sm">
                        {b.percentage}% Used
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-[11px] font-semibold">
                        {b.percentage}%
                      </span>
                    )}
                  </div>
                </div>

                <Progress
                  value={Math.min(100, b.percentage)}
                  variant={b.isExceeded ? "danger" : isWarning ? "warning" : "primary"}
                  size="sm"
                />

                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium pt-0.5">
                  <span>
                    Spent:{" "}
                    <strong className="text-foreground">
                      {formatCurrency(b.spent, currency)}
                    </strong>
                  </span>
                  <span>
                    Limit:{" "}
                    <strong className="text-foreground">
                      {formatCurrency(b.amount, currency)}
                    </strong>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};
