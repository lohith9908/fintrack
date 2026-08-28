import React from "react";
import { AnalyticsPaymentMethodItem } from "../../types/analytics.types";
import { ChartContainer } from "../ui/ChartContainer";
import { formatCurrency } from "../../utils/formatters";
import { CreditCard, Smartphone, Banknote, Building2, HelpCircle } from "lucide-react";

export interface PaymentMethodChartProps {
  data: AnalyticsPaymentMethodItem[];
  currency?: string;
}

export const PaymentMethodChart: React.FC<PaymentMethodChartProps> = ({
  data,
  currency = "INR",
}) => {
  if (!data || data.length === 0) {
    return (
      <ChartContainer
        title="Payment Methods"
        description="Distribution of payment channels"
        summaryText="No transaction methods recorded."
      >
        <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
          No payment method data available.
        </div>
      </ChartContainer>
    );
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "UPI":
        return <Smartphone className="h-4 w-4 text-emerald-500" />;
      case "CREDIT_CARD":
      case "DEBIT_CARD":
        return <CreditCard className="h-4 w-4 text-sky-500" />;
      case "CASH":
        return <Banknote className="h-4 w-4 text-amber-500" />;
      case "BANK_TRANSFER":
      case "NET_BANKING":
        return <Building2 className="h-4 w-4 text-purple-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "UPI":
        return "bg-emerald-500";
      case "CREDIT_CARD":
        return "bg-sky-500";
      case "DEBIT_CARD":
        return "bg-blue-500";
      case "CASH":
        return "bg-amber-500";
      case "BANK_TRANSFER":
        return "bg-purple-500";
      default:
        return "bg-slate-500";
    }
  };

  const totalAmount = data.reduce((acc, item) => acc + item.amount, 0);

  return (
    <ChartContainer
      title="Payment Methods"
      description="Spend breakdown across settlement channels"
      summaryText={`Total settlements: ${formatCurrency(totalAmount, currency)}`}
    >
      <div className="space-y-4 w-full">
        {/* Horizontal Stacked Bar */}
        <div className="h-3.5 w-full rounded-full overflow-hidden flex bg-secondary/80 p-0.5 border border-border/40">
          {data.map((item) => {
            if (item.percentage <= 0) return null;
            return (
              <div
                key={item.method}
                style={{ width: `${Math.max(2, item.percentage)}%` }}
                className={`${getMethodColor(item.method)} h-full first:rounded-l-full last:rounded-r-full transition-all duration-500`}
                title={`${item.method}: ${item.percentage}% (${formatCurrency(item.amount, currency)})`}
              />
            );
          })}
        </div>

        {/* Detailed Item List */}
        <div className="space-y-2.5 pt-1">
          {data.map((item) => (
            <div
              key={item.method}
              className="flex items-center justify-between p-2 rounded-lg bg-card/60 border border-border/40 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-secondary shrink-0">
                  {getMethodIcon(item.method)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {item.method.replace("_", " ")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {item.count} transaction{item.count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xs font-bold font-mono text-foreground">
                  {formatCurrency(item.amount, currency)}
                </p>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartContainer>
  );
};
