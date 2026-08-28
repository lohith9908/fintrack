import React, { useState } from "react";
import { AnalyticsMonthlyTrendItem } from "../../types/analytics.types";
import { ChartContainer } from "../ui/ChartContainer";
import { formatCurrency } from "../../utils/formatters";

export interface SpendingTrendChartProps {
  data: AnalyticsMonthlyTrendItem[];
  currency?: string;
  title?: string;
  description?: string;
}

export const SpendingTrendChart: React.FC<SpendingTrendChartProps> = ({
  data,
  currency = "INR",
  title = "Income vs Expenses",
  description = "Historical monthly cash flow comparison",
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <ChartContainer title={title} description={description} summaryText="No trend data available for this range.">
        <div className="h-56 flex items-center justify-center text-xs text-muted-foreground">
          No monthly trend records found.
        </div>
      </ChartContainer>
    );
  }

  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    10000
  );

  const chartHeight = 190;
  const paddingX = 40;
  const paddingY = 25;
  const totalWidth = Math.max(450, data.length * 75 + paddingX * 2);

  return (
    <ChartContainer
      title={title}
      description={description}
      summaryText={`Tracking ${data.length} month${data.length > 1 ? "s" : ""} of historical activity`}
      action={
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            <span className="text-muted-foreground font-medium">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
            <span className="text-muted-foreground font-medium">Expense</span>
          </div>
        </div>
      }
    >
      <div className="w-full relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${totalWidth} ${chartHeight + paddingY * 2}`}
          className="w-full h-60 min-w-[320px] overflow-visible select-none"
        >
          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={totalWidth - paddingX}
            y2={paddingY}
            stroke="currentColor"
            className="text-border/40"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={paddingY + chartHeight / 2}
            x2={totalWidth - paddingX}
            y2={paddingY + chartHeight / 2}
            stroke="currentColor"
            className="text-border/40"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={paddingY + chartHeight}
            x2={totalWidth - paddingX}
            y2={paddingY + chartHeight}
            stroke="currentColor"
            className="text-border"
          />

          {/* Value scale labels */}
          <text
            x={paddingX - 8}
            y={paddingY + 4}
            textAnchor="end"
            className="text-[9px] fill-muted-foreground font-mono"
          >
            {formatCurrency(maxVal, currency)}
          </text>
          <text
            x={paddingX - 8}
            y={paddingY + chartHeight / 2 + 4}
            textAnchor="end"
            className="text-[9px] fill-muted-foreground font-mono"
          >
            {formatCurrency(maxVal / 2, currency)}
          </text>
          <text
            x={paddingX - 8}
            y={paddingY + chartHeight + 4}
            textAnchor="end"
            className="text-[9px] fill-muted-foreground font-mono"
          >
            ₹0
          </text>

          {/* Bars */}
          {data.map((item, idx) => {
            const groupWidth = (totalWidth - paddingX * 2) / data.length;
            const groupX = paddingX + idx * groupWidth + (groupWidth - 52) / 2;
            const incomeHeight = Math.max(4, (item.income / maxVal) * chartHeight);
            const expenseHeight = Math.max(4, (item.expense / maxVal) * chartHeight);

            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={item.month}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer transition-opacity"
              >
                {/* Background highlight on hover */}
                {isHovered && (
                  <rect
                    x={groupX - 8}
                    y={paddingY}
                    width={68}
                    height={chartHeight}
                    fill="currentColor"
                    className="text-secondary/60"
                    rx={6}
                  />
                )}

                {/* Income Bar */}
                <rect
                  x={groupX}
                  y={paddingY + chartHeight - incomeHeight}
                  width={22}
                  height={incomeHeight}
                  fill="#10B981"
                  rx={4}
                  className="transition-all duration-300 hover:brightness-110"
                />

                {/* Expense Bar */}
                <rect
                  x={groupX + 26}
                  y={paddingY + chartHeight - expenseHeight}
                  width={22}
                  height={expenseHeight}
                  fill="#F43F5E"
                  rx={4}
                  className="transition-all duration-300 hover:brightness-110"
                />

                {/* Month Label */}
                <text
                  x={groupX + 24}
                  y={paddingY + chartHeight + 16}
                  textAnchor="middle"
                  className={`text-[10px] font-medium transition-colors ${
                    isHovered ? "fill-foreground font-bold" : "fill-muted-foreground"
                  }`}
                >
                  {item.label.split(" ")[0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Popover Tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div className="absolute top-2 right-4 p-3 rounded-xl border border-border bg-popover/95 backdrop-blur-md shadow-xl text-xs space-y-1.5 z-10 animate-fadeIn pointer-events-none min-w-[170px]">
            <p className="font-bold text-foreground border-b border-border/40 pb-1">
              {data[hoveredIndex].label}
            </p>
            <div className="flex items-center justify-between gap-4">
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-xs bg-emerald-500 inline-block" />
                Income:
              </span>
              <span className="font-bold text-foreground font-mono">
                +{formatCurrency(data[hoveredIndex].income, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-rose-500 font-semibold flex items-center gap-1">
                <span className="h-2 w-2 rounded-xs bg-rose-500 inline-block" />
                Expense:
              </span>
              <span className="font-bold text-foreground font-mono">
                -{formatCurrency(data[hoveredIndex].expense, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-border/40 text-[11px]">
              <span className="text-muted-foreground">Savings Rate:</span>
              <span className={data[hoveredIndex].savingsRate >= 0 ? "font-bold text-emerald-500" : "font-bold text-rose-500"}>
                {data[hoveredIndex].savingsRate}%
              </span>
            </div>
          </div>
        )}
      </div>
    </ChartContainer>
  );
};
