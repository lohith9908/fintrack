import React, { useState } from "react";
import { MonthlyTrendItem } from "../../types/dashboard.types";
import { ChartContainer } from "../ui/ChartContainer";
import { formatCurrency } from "../../utils/formatters";

export interface IncomeExpenseChartProps {
  data: MonthlyTrendItem[];
  currency?: string;
}

export const IncomeExpenseChart: React.FC<IncomeExpenseChartProps> = ({
  data,
  currency = "INR",
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <ChartContainer
        title="Income vs Expenses"
        description="Historical cash flow comparison"
        summaryText="No trend data recorded yet."
      >
        <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
          No monthly data available.
        </div>
      </ChartContainer>
    );
  }

  // Calculate scaling max value
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.income, d.expense)),
    10000
  );

  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 20;

  return (
    <ChartContainer
      title="Income vs Expenses"
      description="Monthly comparison of recorded earnings vs spendings"
      summaryText="Continuous 6-month historical tracking"
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
      <div className="w-full relative">
        <svg
          viewBox={`0 0 ${data.length * 80 + paddingX * 2} ${chartHeight + paddingY * 2}`}
          className="w-full h-56 overflow-visible"
        >
          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={data.length * 80 + paddingX}
            y2={paddingY}
            stroke="currentColor"
            className="text-border/40"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={paddingY + chartHeight / 2}
            x2={data.length * 80 + paddingX}
            y2={paddingY + chartHeight / 2}
            stroke="currentColor"
            className="text-border/40"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={paddingY + chartHeight}
            x2={data.length * 80 + paddingX}
            y2={paddingY + chartHeight}
            stroke="currentColor"
            className="text-border"
          />

          {/* Bars */}
          {data.map((item, idx) => {
            const groupX = paddingX + idx * 80 + 10;
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
                    x={groupX - 10}
                    y={paddingY}
                    width={70}
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
                  className={`text-[10px] fill-muted-foreground font-medium ${
                    isHovered ? "fill-foreground font-bold" : ""
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
          <div className="absolute top-2 right-4 p-2.5 rounded-xl border border-border bg-popover/95 backdrop-blur-md shadow-lg text-xs space-y-1 z-10 animate-fadeIn pointer-events-none">
            <p className="font-bold text-foreground border-b border-border/40 pb-1">
              {data[hoveredIndex].label}
            </p>
            <div className="flex items-center justify-between gap-4">
              <span className="text-emerald-500 font-semibold">Income:</span>
              <span className="font-bold text-foreground">
                +{formatCurrency(data[hoveredIndex].income, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-rose-500 font-semibold">Expense:</span>
              <span className="font-bold text-foreground">
                -{formatCurrency(data[hoveredIndex].expense, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-border/40 text-[11px]">
              <span className="text-muted-foreground">Savings Rate:</span>
              <span className="font-bold text-foreground">
                {data[hoveredIndex].savingsRate}%
              </span>
            </div>
          </div>
        )}
      </div>
    </ChartContainer>
  );
};
