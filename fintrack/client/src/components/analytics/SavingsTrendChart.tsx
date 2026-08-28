import React, { useState } from "react";
import { AnalyticsMonthlyTrendItem } from "../../types/analytics.types";
import { ChartContainer } from "../ui/ChartContainer";
import { formatCurrency } from "../../utils/formatters";

export interface SavingsTrendChartProps {
  data: AnalyticsMonthlyTrendItem[];
  currency?: string;
}

export const SavingsTrendChart: React.FC<SavingsTrendChartProps> = ({
  data,
  currency = "INR",
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <ChartContainer
        title="Savings Trend"
        description="Net monthly surplus and savings efficiency"
        summaryText="No savings records found."
      >
        <div className="h-56 flex items-center justify-center text-xs text-muted-foreground">
          No savings data available.
        </div>
      </ChartContainer>
    );
  }

  // Find range of savings
  const maxSavings = Math.max(...data.map((d) => Math.max(0, d.savings)), 5000);
  const minSavings = Math.min(...data.map((d) => Math.min(0, d.savings)), 0);
  const span = Math.max(maxSavings - minSavings, 5000);

  const chartHeight = 190;
  const paddingX = 40;
  const paddingY = 25;
  const totalWidth = Math.max(450, data.length * 75 + paddingX * 2);

  // Baseline Y coordinate for ₹0
  const zeroY = paddingY + chartHeight * (maxSavings / span);

  return (
    <ChartContainer
      title="Savings Progression"
      description="Net monthly wealth accumulation and disciplined savings trajectory"
      summaryText="Continuous savings performance"
      action={
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
            <span className="text-muted-foreground font-medium">Net Savings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
            <span className="text-muted-foreground font-medium">Deficit</span>
          </div>
        </div>
      }
    >
      <div className="w-full relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${totalWidth} ${chartHeight + paddingY * 2}`}
          className="w-full h-60 min-w-[320px] overflow-visible select-none"
        >
          {/* Zero baseline */}
          <line
            x1={paddingX}
            y1={zeroY}
            x2={totalWidth - paddingX}
            y2={zeroY}
            stroke="currentColor"
            className="text-border"
            strokeWidth={1.5}
          />

          {/* Top guide line */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={totalWidth - paddingX}
            y2={paddingY}
            stroke="currentColor"
            className="text-border/40"
            strokeDasharray="4 4"
          />

          {/* Scale labels */}
          <text
            x={paddingX - 8}
            y={paddingY + 4}
            textAnchor="end"
            className="text-[9px] fill-muted-foreground font-mono"
          >
            +{formatCurrency(maxSavings, currency)}
          </text>
          <text
            x={paddingX - 8}
            y={zeroY + 3}
            textAnchor="end"
            className="text-[9px] fill-muted-foreground font-mono font-bold"
          >
            ₹0
          </text>

          {/* Bars */}
          {data.map((item, idx) => {
            const groupWidth = (totalWidth - paddingX * 2) / data.length;
            const barWidth = 32;
            const barX = paddingX + idx * groupWidth + (groupWidth - barWidth) / 2;

            const isPositive = item.savings >= 0;
            const barHeight = Math.max(
              4,
              (Math.abs(item.savings) / span) * chartHeight
            );

            const barY = isPositive ? zeroY - barHeight : zeroY;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={item.month}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer transition-opacity"
              >
                {/* Hover backdrop */}
                {isHovered && (
                  <rect
                    x={barX - 8}
                    y={paddingY}
                    width={barWidth + 16}
                    height={chartHeight}
                    fill="currentColor"
                    className="text-secondary/60"
                    rx={6}
                  />
                )}

                {/* Savings Bar */}
                <rect
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill={isPositive ? "#6366F1" : "#F43F5E"}
                  rx={4}
                  className="transition-all duration-300 hover:brightness-110"
                />

                {/* Month label */}
                <text
                  x={barX + barWidth / 2}
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

        {/* Hover Tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div className="absolute top-2 right-4 p-3 rounded-xl border border-border bg-popover/95 backdrop-blur-md shadow-xl text-xs space-y-1.5 z-10 animate-fadeIn pointer-events-none min-w-[170px]">
            <p className="font-bold text-foreground border-b border-border/40 pb-1">
              {data[hoveredIndex].label}
            </p>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground font-medium">Net Savings:</span>
              <span
                className={`font-bold font-mono ${
                  data[hoveredIndex].savings >= 0 ? "text-primary" : "text-rose-500"
                }`}
              >
                {data[hoveredIndex].savings >= 0 ? "+" : ""}
                {formatCurrency(data[hoveredIndex].savings, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-border/40 text-[11px]">
              <span className="text-muted-foreground">Savings Rate:</span>
              <span
                className={`font-bold ${
                  data[hoveredIndex].savingsRate >= 0 ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {data[hoveredIndex].savingsRate}%
              </span>
            </div>
          </div>
        )}
      </div>
    </ChartContainer>
  );
};
