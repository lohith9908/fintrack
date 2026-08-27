import React from "react";
import { cn } from "../../utils/cn";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "card";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "rectangular",
  ...props
}) => {
  const variantStyles = {
    text: "h-4 w-full rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg",
    card: "h-32 w-full rounded-xl",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-muted/70",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
};
