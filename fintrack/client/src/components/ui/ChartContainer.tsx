import React from "react";
import { cn } from "../../utils/cn";

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  summaryText?: string;
  minHeight?: number | string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  description,
  action,
  summaryText,
  minHeight = 260,
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm space-y-4 transition-all",
        className
      )}
      {...props}
    >
      {(title || description || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
          <div className="space-y-0.5">
            {title && (
              <h3 className="text-sm font-bold tracking-tight text-foreground">{title}</h3>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}

      {/* Responsive Chart Viewport */}
      <div
        className="w-full relative flex items-center justify-center overflow-hidden"
        style={{ minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight }}
      >
        {children}
      </div>

      {/* Accessibility Summary Text per UI_UX.md Section 82 */}
      {summaryText && (
        <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>{summaryText}</span>
        </div>
      )}
    </div>
  );
};
