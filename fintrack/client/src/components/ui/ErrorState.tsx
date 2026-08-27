import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "We were unable to complete your request. Please check your connection and try again.",
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-destructive/20 bg-destructive/5 my-4 space-y-3",
        className
      )}
    >
      <div className="p-3.5 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center shadow-inner">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="text-sm font-bold text-foreground tracking-tight">{title}</h3>
        {message && (
          <p className="text-xs text-muted-foreground leading-relaxed">{message}</p>
        )}
      </div>
      {onRetry && (
        <div className="pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
};
