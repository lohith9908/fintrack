import React from "react";
import { Inbox } from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-border bg-card/40 my-4 space-y-3",
        className
      )}
    >
      <div className="p-3.5 rounded-2xl bg-secondary text-muted-foreground flex items-center justify-center shadow-inner">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
