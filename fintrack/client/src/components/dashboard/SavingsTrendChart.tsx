import React, { useState } from "react";
import { MonthlyTrendItem } from "../../types/dashboard.types";
import { ChartContainer } from "../ui/ChartContainer";
import { formatCurrency } from "../../utils/formatters";

export interface SavingsTrendChartProps {
  data: MonthlyTrendItem[];
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
        title="Savings & Spending Trajectory"
        description="Net monthly wealth accumulation"
        summaryText="No trend data recorded yet."
      >
        <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
          No historical savings data available.
        </div>
      </ChartContainer>
    );
  }

  const chartHeight = 160;
  const paddingX = 40;
  const paddingY = 25;

  const maxSavings = Math.max(...data.map((d) => Math.max(0, d.savings)), 10000);
  const minSavings = Math.min(...data.map((d) => Math.min(0, d.savings)), 0);
  const range = maxSavings - minSavings || 1;

  const getX = (idx: number) => paddingX + idx * 80 + 30;
  const getY = (val: number) =>
    paddingY + chartHeight - ((val - minSavings) / range) * chartHeight;

  // Build SVG path points
  const points = data.map((d, i) => `${getX(i)},${getY(d.savings)}`).join(" ");

  // Zero-line Y coordinate
  const zeroY = getY(0);

  return (
    <ChartContainer
      title="Savings & Accumulation Trend"
      description="Net monthly surplus trajectory over time"
      summaryText="Monitors cash flow velocity and positive savings accumulation"
    >
      <div className="w-full relative">
        <svg
          viewBox={`0 0 ${data.length * 80 + paddingX * 2} ${chartHeight + paddingY * 2}`}
          className="w-full h-52 overflow-visible"
        >
          {/* Zero baseline */}
          <line
            x1={paddingX}
            y1={zeroY}
            x2={data.length * 80 + paddingX}
            y2={zeroY}
            stroke="currentColor"
            className="text-border"
            strokeDasharray="4 4"
          />

          {/* Area Fill */}
          <polygon
            points={`${getX(0)},${zeroY} ${points} ${getX(data.length - 1)},${zeroY}`}
            fill="currentColor"
            className="text-primary/10"
          />

          {/* Trend Polyline */}
          <polyline
            points={points}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {data.map((item, idx) => {
            const cx = getX(idx);
            const cy = getY(item.savings);
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={item.month}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill={item.savings >= 0 ? "#10B981" : "#F43F5E"}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all duration-200"
                />

                <text
                  x={cx}
                  y={paddingY + chartHeight + 18}
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

        {/* Hover Popover */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div className="absolute top-2 right-4 p-2.5 rounded-xl border border-border bg-popover/95 backdrop-blur-md shadow-lg text-xs space-y-1 z-10 animate-fadeIn pointer-events-none">
            <p className="font-bold text-foreground border-b border-border/40 pb-1">
              {data[hoveredIndex].label}
            </p>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Net Savings:</span>
              <span
                className={`font-bold ${
                  data[hoveredIndex].savings >= 0 ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {data[hoveredIndex].savings >= 0 ? "+" : ""}
                {formatCurrency(data[hoveredIndex].savings, currency)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <span className="text-muted-foreground">Savings Rate:</span>
              <span className="font-bold text-primary">
                {data[hoveredIndex].savingsRate}%
              </span>
            </div>
          </div>
        )}
      </div>
    </ChartContainer>
  );
};
