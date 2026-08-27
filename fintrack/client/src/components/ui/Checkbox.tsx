import React from "react";
import { Check } from "lucide-react";
import { cn } from "../../utils/cn";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, error, id, disabled, checked, ...props }, ref) => {
    const checkboxId = id || (typeof label === "string" ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col space-y-1">
        <label
          htmlFor={checkboxId}
          className={cn(
            "inline-flex items-start space-x-2.5 cursor-pointer select-none",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              id={checkboxId}
              type="checkbox"
              ref={ref}
              disabled={disabled}
              checked={checked}
              className="peer sr-only"
              {...props}
            />
            <div
              className={cn(
                "h-4 w-4 rounded border border-border bg-card transition-all duration-150 flex items-center justify-center",
                "peer-checked:bg-primary peer-checked:border-primary peer-checked:text-primary-foreground",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
                error && "border-destructive",
                className
              )}
            >
              <Check className="h-3 w-3 opacity-0 peer-checked:opacity-100 transition-opacity stroke-[3]" />
            </div>
          </div>
          {(label || description) && (
            <div className="space-y-0.5">
              {label && (
                <span className="text-sm font-medium text-foreground leading-none block">
                  {label}
                </span>
              )}
              {description && (
                <p className="text-xs text-muted-foreground leading-normal">
                  {description}
                </p>
              )}
            </div>
          )}
        </label>
        {error && (
          <p className="text-xs text-destructive font-medium tracking-tight animate-fadeIn pl-7">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
