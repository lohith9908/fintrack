import React from "react";
import { Calendar, RotateCcw, Wallet, Tag, CreditCard } from "lucide-react";
import { AnalyticsFilterParams, AnalyticsPeriod } from "../../types/analytics.types";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";

export interface FilterOption {
  value: string;
  label: string;
}

export interface AnalyticsFilterBarProps {
  filters: AnalyticsFilterParams;
  onFilterChange: (updated: Partial<AnalyticsFilterParams>) => void;
  onResetFilters: () => void;
  accounts?: Array<{ _id: string; name: string }>;
  categories?: Array<{ _id: string; name: string; type: string }>;
  isLoading?: boolean;
}

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  accounts = [],
  categories = [],
  isLoading = false,
}) => {
  const periodOptions: Array<{ value: AnalyticsPeriod; label: string }> = [
    { value: "30d", label: "Last 30 Days" },
    { value: "7d", label: "Last 7 Days" },
    { value: "this_month", label: "This Month" },
    { value: "last_month", label: "Last Month" },
    { value: "3m", label: "Last 3 Months" },
    { value: "6m", label: "Last 6 Months" },
    { value: "12m", label: "Last 12 Months" },
    { value: "year_to_date", label: "Year to Date" },
    { value: "all", label: "All Time" },
  ];

  const paymentMethodOptions = [
    { value: "", label: "All Payment Methods" },
    { value: "UPI", label: "UPI" },
    { value: "CREDIT_CARD", label: "Credit Card" },
    { value: "DEBIT_CARD", label: "Debit Card" },
    { value: "CASH", label: "Cash" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "OTHER", label: "Other" },
  ];

  const accountOptions = [
    { value: "", label: "All Accounts" },
    ...accounts.map((a) => ({ value: a._id, label: a.name })),
  ];

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...categories.map((c) => ({ value: c._id, label: c.name })),
  ];

  const isFiltered =
    Boolean(filters.accountId) ||
    Boolean(filters.categoryId) ||
    Boolean(filters.paymentMethod) ||
    (filters.period && filters.period !== "30d");

  return (
    <div className="p-4 rounded-xl border border-border bg-card/80 backdrop-blur-md shadow-xs space-y-3 transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 flex-1">
          {/* Period Selector */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>Timeframe</span>
            </label>
            <Select
              value={filters.period || "30d"}
              onChange={(e) => onFilterChange({ period: e.target.value as AnalyticsPeriod })}
              options={periodOptions}
              disabled={isLoading}
            />
          </div>

          {/* Account Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" />
              <span>Account</span>
            </label>
            <Select
              value={filters.accountId || ""}
              onChange={(e) => onFilterChange({ accountId: e.target.value || undefined })}
              options={accountOptions}
              disabled={isLoading}
            />
          </div>

          {/* Category Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              <span>Category</span>
            </label>
            <Select
              value={filters.categoryId || ""}
              onChange={(e) => onFilterChange({ categoryId: e.target.value || undefined })}
              options={categoryOptions}
              disabled={isLoading}
            />
          </div>

          {/* Payment Method Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              <span>Payment Method</span>
            </label>
            <Select
              value={filters.paymentMethod || ""}
              onChange={(e) => onFilterChange({ paymentMethod: e.target.value || undefined })}
              options={paymentMethodOptions}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Right: Actions */}
        {isFiltered && (
          <div className="flex items-end shrink-0 pt-1 lg:pt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              disabled={isLoading}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground h-9"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              <span>Reset Filters</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
