/**
 * FinTrack Centralized Formatting Utilities per UI_UX.md
 */

/**
 * Format currency amount with symbol (default: INR ₹)
 * @param amount Numeric value to format
 * @param currency ISO currency code (default: INR)
 * @param showDecimals Whether to show decimal precision (default: auto if cents exist)
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency = "INR",
  showDecimals = false
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return currency === "INR" ? "₹0" : "0.00";
  }

  const hasDecimals = amount % 1 !== 0;
  const minimumFractionDigits = showDecimals || hasDecimals ? 2 : 0;
  const maximumFractionDigits = 2;

  if (currency === "INR") {
    // Custom clean INR formatting per UI_UX.md: ₹50,000 or ₹32,500.50
    const formattedNum = new Intl.NumberFormat("en-IN", {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(Math.abs(amount));

    const sign = amount < 0 ? "-" : "";
    return `${sign}₹${formattedNum}`;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Format numeric value with thousands separator
 */
export function formatNumber(
  value: number | null | undefined,
  decimals = 0
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0";
  }
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage value (e.g. 43.75%)
 */
export function formatPercent(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "0%";
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date string or Date object per UI_UX.md (e.g. "22 Aug 2026")
 */
export function formatDate(
  date: Date | string | number | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "—";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";

  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  };

  return new Intl.DateTimeFormat("en-IN", defaultOptions).format(d);
}

/**
 * Format relative time (e.g. "2 minutes ago", "Yesterday")
 */
export function formatRelativeTime(date: Date | string | number | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return formatDate(d);
}
