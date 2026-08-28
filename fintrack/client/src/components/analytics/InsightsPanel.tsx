import React from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  Target,
  Calendar,
  Lightbulb,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { FinancialInsightItem } from "../../types/analytics.types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";

export interface InsightsPanelProps {
  insights: FinancialInsightItem[];
  isLoading?: boolean;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({
  insights,
  isLoading = false,
}) => {
  const getInsightIcon = (type: string, rule: string) => {
    if (rule.includes("GOAL")) {
      return <Target className="h-4 w-4 text-emerald-500" />;
    }
    if (rule.includes("RECURRING") || rule.includes("BILL")) {
      return <Calendar className="h-4 w-4 text-sky-500" />;
    }
    if (rule.includes("SAVINGS") || type === "SUCCESS") {
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    }
    if (type === "WARNING" || rule.includes("EXPENSE") || rule.includes("BUDGET")) {
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    }
    return <Lightbulb className="h-4 w-4 text-purple-500" />;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return <Badge variant="danger" size="sm">High Priority</Badge>;
      case "MEDIUM":
        return <Badge variant="warning" size="sm">Moderate</Badge>;
      case "LOW":
      default:
        return <Badge variant="secondary" size="sm">Positive</Badge>;
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <CardTitle className="text-base font-bold">Deterministic Financial Insights</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Automated, explainable intelligence computed directly from your verified ledger data.
          </CardDescription>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>100% Private & Deterministic</span>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {isLoading ? (
          <div className="py-8 text-center space-y-2">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground">Evaluating financial rules...</p>
          </div>
        ) : insights.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <div className="h-8 w-8 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto">
              <Lightbulb className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold text-foreground">No critical alerts detected</p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Your financial activities are well within defined limits and targets.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={cn(
                  "p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3",
                  insight.type === "WARNING"
                    ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
                    : insight.type === "SUCCESS"
                    ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
                    : "bg-card/70 border-border/60 hover:border-border"
                )}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-card border border-border shrink-0 shadow-2xs">
                        {getInsightIcon(insight.type, insight.rule)}
                      </div>
                      <h4 className="text-xs font-bold text-foreground">{insight.title}</h4>
                    </div>
                    {getSeverityBadge(insight.severity)}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.message}
                  </p>
                </div>

                {insight.actionUrl && (
                  <div className="pt-2 border-t border-border/30 flex justify-end">
                    <Link to={insight.actionUrl}>
                      <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold px-2 text-primary hover:text-primary/80">
                        <span>{insight.actionLabel || "View Details"}</span>
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
