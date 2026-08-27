import React, { useState } from "react";
import { CategoryBreakdownItem } from "../../types/dashboard.types";
import { ChartContainer } from "../ui/ChartContainer";
import { formatCurrency } from "../../utils/formatters";

export interface CategoryPieChartProps {
  categories: CategoryBreakdownItem[];
  currency?: string;
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  categories,
  currency = "INR",
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const totalExpense = categories.reduce((sum, c) => sum + c.amount, 0);

  if (!categories || categories.length === 0 || totalExpense === 0) {
    return (
      <ChartContainer
        title="Expense Categories"
        description="Category spending allocation"
        summaryText="No category spendings recorded"
      >
        <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
          No expenses recorded in this period.
        </div>
      </ChartContainer>
    );
  }

  // Precompute SVG Donut Arc parameters
  let cumulativeAngle = 0;
  const radius = 60;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  const arcs = categories.map((cat, idx) => {
    const percentage = cat.amount / totalExpense;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += percentage;

    return {
      ...cat,
      idx,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <ChartContainer
      title="Expense Categories"
      description="Spendings categorized by allocation share"
      summaryText={`${categories.length} active spending categories`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full py-2">
        {/* SVG Donut */}
        <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
            {arcs.map((arc) => (
              <circle
                key={arc.categoryId}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={arc.color || "#3B82F6"}
                strokeWidth={hoveredIndex === arc.idx ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={arc.strokeDasharray}
                strokeDashoffset={arc.strokeDashoffset}
                className="transition-all duration-300 cursor-pointer hover:opacity-90"
                onMouseEnter={() => setHoveredIndex(arc.idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </svg>

          {/* Center Summary Label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {hoveredIndex !== null && categories[hoveredIndex]
                ? categories[hoveredIndex].name
                : "Total Spend"}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-foreground tracking-tight line-clamp-1">
              {hoveredIndex !== null && categories[hoveredIndex]
                ? formatCurrency(categories[hoveredIndex].amount, currency)
                : formatCurrency(totalExpense, currency)}
            </span>
            {hoveredIndex !== null && categories[hoveredIndex] && (
              <span className="text-[10px] font-bold text-primary">
                {categories[hoveredIndex].percentage}%
              </span>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-2 w-full max-h-48 overflow-y-auto pr-1">
          {categories.map((cat, idx) => (
            <div
              key={cat.categoryId}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`p-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                hoveredIndex === idx ? "bg-secondary" : "hover:bg-secondary/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color || "#3B82F6" }}
                />
                <span className="font-semibold text-foreground line-clamp-1">
                  {cat.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-right font-medium">
                <span className="text-muted-foreground">{cat.percentage}%</span>
                <span className="font-bold text-foreground">
                  {formatCurrency(cat.amount, currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartContainer>
  );
};
