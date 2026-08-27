import React from "react";
import { FinancialInsight } from "../../types/dashboard.types";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  Lightbulb,
} from "lucide-react";

export interface InsightsWidgetProps {
  insights: FinancialInsight[];
}

export const InsightsWidget: React.FC<InsightsWidgetProps> = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Financial Insights & Diagnostics</span>
        </h3>
        <span className="text-[11px] text-muted-foreground">
          Deterministic Rule Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {insights.map((insight) => {
          const isSuccess = insight.type === "SUCCESS";
          const isWarning = insight.type === "WARNING";
          const isTip = insight.type === "TIP";

          const IconComponent = isSuccess
            ? CheckCircle2
            : isWarning
            ? AlertTriangle
            : isTip
            ? Lightbulb
            : Info;

          return (
            <div
              key={insight.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                isSuccess
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : isWarning
                  ? "bg-rose-500/5 border-rose-500/20 text-rose-600 dark:text-rose-400"
                  : isTip
                  ? "bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400"
                  : "bg-primary/5 border-primary/20 text-primary"
              }`}
            >
              <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-foreground">{insight.title}</p>
                <p className="text-muted-foreground leading-relaxed">
                  {insight.message}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
