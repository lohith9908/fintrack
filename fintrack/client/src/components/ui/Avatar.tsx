import React, { useState } from "react";
import { User as UserIcon } from "lucide-react";
import { cn } from "../../utils/cn";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "busy";
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = "md",
  status,
  className,
  ...props
}) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (n?: string) => {
    if (!n) return "";
    const parts = n.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const sizeStyles = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-xl",
  };

  const statusStyles = {
    online: "bg-success",
    offline: "bg-muted-foreground",
    busy: "bg-destructive",
  };

  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold tracking-wider overflow-hidden border border-border/80 select-none shadow-sm",
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={name || "Avatar"}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover"
          />
        ) : name ? (
          <span>{getInitials(name)}</span>
        ) : (
          <UserIcon className="h-1/2 w-1/2 text-muted-foreground" />
        )}
      </div>
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-card",
            statusStyles[status]
          )}
        />
      )}
    </div>
  );
};
