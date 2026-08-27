import React from "react";
import { Link } from "react-router-dom";
import { GoalStatusItem } from "../../types/dashboard.types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Progress,
} from "../ui";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { PiggyBank, ArrowRight } from "lucide-react";

export interface SavingsGoalsWidgetProps {
  goals: GoalStatusItem[];
  currency?: string;
}

export const SavingsGoalsWidget: React.FC<SavingsGoalsWidgetProps> = ({
  goals,
  currency = "INR",
}) => {
  return (
    <Card className="border border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold">Savings Goals</CardTitle>
            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
              <PiggyBank className="h-3.5 w-3.5" />
            </span>
          </div>
          <CardDescription className="text-xs">
            Progress toward your target milestones
          </CardDescription>
        </div>
        <Link
          to="/goals"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <span>All Goals</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 space-y-3.5 text-xs">
        {goals.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground space-y-2">
            <p>No active savings goals configured.</p>
            <Link to="/goals" className="text-primary font-semibold hover:underline block text-xs">
              + Create New Goal
            </Link>
          </div>
        ) : (
          goals.map((g) => (
            <div
              key={g._id}
              className="p-3 rounded-xl border border-border/60 bg-secondary/20 hover:bg-secondary/40 transition-colors space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{g.name}</span>
                <span className="font-extrabold text-emerald-500">
                  {g.percentage}%
                </span>
              </div>

              <Progress value={g.percentage} variant="success" size="sm" />

              <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium pt-0.5">
                <span>
                  Saved:{" "}
                  <strong className="text-foreground">
                    {formatCurrency(g.currentAmount, currency)}
                  </strong>
                </span>
                <span>
                  Target:{" "}
                  <strong className="text-foreground">
                    {formatCurrency(g.targetAmount, currency)}
                  </strong>
                </span>
              </div>

              {g.targetDate && (
                <p className="text-[10px] text-muted-foreground text-right">
                  Target: {formatDate(g.targetDate)}
                </p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
