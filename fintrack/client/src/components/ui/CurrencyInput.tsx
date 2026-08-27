import React from "react";
import { cn } from "../../utils/cn";

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  label?: string;
  error?: string;
  helperText?: string;
  currencySymbol?: string;
  value?: number | string;
  onChangeValue?: (value: number) => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      currencySymbol = "₹",
      value = "",
      onChangeValue,
      id,
      disabled,
      placeholder = "0.00",
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^0-9.]/g, "");
      // Allow only one decimal point
      const parts = rawValue.split(".");
      const cleanValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : rawValue;

      if (onChangeValue) {
        const num = parseFloat(cleanValue);
        onChangeValue(isNaN(num) ? 0 : num);
      }
    };

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-foreground tracking-tight"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <div className="absolute left-3 flex items-center pointer-events-none text-base font-semibold text-muted-foreground select-none">
            {currencySymbol}
          </div>
          <input
            id={inputId}
            type="text"
            inputMode="decimal"
            ref={ref}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full rounded-lg border border-input bg-card pl-8 pr-3 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors",
              "placeholder:text-muted-foreground/50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-destructive font-medium tracking-tight animate-fadeIn">
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
