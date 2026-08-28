import React from "react";
import { AnalyticsAccountItem } from "../../types/analytics.types";
import { ChartContainer } from "../ui/ChartContainer";
import { formatCurrency } from "../../utils/formatters";
import { Wallet, Landmark, CreditCard, HelpCircle } from "lucide-react";
import { Progress } from "../ui/Progress";

export interface AccountSpendingChartProps {
  data: AnalyticsAccountItem[];
  currency?: string;
}

export const AccountSpendingChart: React.FC<AccountSpendingChartProps> = ({
  data,
  currency = "INR",
}) => {
  if (!data || data.length === 0) {
    return (
      <ChartContainer
        title="Account Activity"
        description="Outflow distribution by financial account"
        summaryText="No account spending recorded."
      >
        <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
          No account data available.
        </div>
      </ChartContainer>
    );
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "BANK_ACCOUNT":
        return <Landmark className="h-4 w-4 text-sky-500" />;
      case "CREDIT_CARD":
        return <CreditCard className="h-4 w-4 text-purple-500" />;
      case "CASH":
      case "WALLET":
        return <Wallet className="h-4 w-4 text-emerald-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const total = data.reduce((acc, a) => acc + a.amount, 0);

  return (
    <ChartContainer
      title="Account Spending"
      description="Capital deployment across accounts and wallets"
      summaryText={`Total account outflow: ${formatCurrency(total, currency)}`}
    >
      <div className="space-y-3.5 w-full">
        {data.map((acc) => (
          <div key={acc.accountId} className="space-y-1.5 p-2 rounded-lg bg-card/60 border border-border/40 hover:bg-muted/40 transition-colors">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-secondary shrink-0">
                  {getAccountIcon(acc.type)}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground truncate">{acc.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {acc.type.toLowerCase().replace("_", " ")} • {acc.count} txns
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold font-mono text-foreground">
                  {formatCurrency(acc.amount, currency)}
                </p>
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {acc.percentage}%
                </span>
              </div>
            </div>

            <Progress value={acc.percentage} max={100} size="sm" variant="primary" />
          </div>
        ))}
      </div>
    </ChartContainer>
  );
};
