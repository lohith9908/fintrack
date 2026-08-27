import React from "react";
import { cn } from "../../utils/cn";

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: "pill" | "underline";
  size?: "sm" | "md";
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = "pill",
  size = "md",
  className,
}) => {
  return (
    <div
      role="tablist"
      className={cn(
        "flex items-center",
        variant === "pill" && "p-1 rounded-xl bg-secondary/80 border border-border/50",
        variant === "underline" && "border-b border-border space-x-6",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "relative inline-flex items-center justify-center font-medium transition-all duration-150 select-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              size === "sm" ? "text-xs px-2.5 py-1 gap-1.5" : "text-sm px-3.5 py-1.5 gap-2",
              variant === "pill" && [
                "rounded-lg",
                isActive
                  ? "bg-card text-foreground shadow-sm font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              ],
              variant === "underline" && [
                "pb-2.5 pt-1",
                isActive
                  ? "text-primary border-b-2 border-primary font-semibold -mb-px"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent",
              ]
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && <span className="ml-1">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
};
