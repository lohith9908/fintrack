import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import { IconButton } from "./IconButton";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  placement?: "left" | "right" | "bottom";
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  placement = "right",
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const placementStyles = {
    right: "inset-y-0 right-0 max-w-md w-full border-l border-border",
    left: "inset-y-0 left-0 max-w-md w-full border-r border-border",
    bottom: "inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t border-border",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed bg-card shadow-2xl p-6 flex flex-col justify-between transition-transform animate-fadeIn z-10",
          placementStyles[placement],
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border/60">
          <div className="space-y-1">
            {title && <h3 className="text-base font-bold tracking-tight text-foreground">{title}</h3>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <IconButton
            aria-label="Close drawer"
            size="sm"
            onClick={onClose}
            icon={<X className="h-4 w-4" />}
          />
        </div>

        <div className="flex-1 overflow-y-auto py-4 text-sm text-foreground">{children}</div>

        {footer && (
          <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
