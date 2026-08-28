import React from "react";
import { MonthlyReportData } from "../../types/report.types";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Progress } from "../ui/Progress";
import {
  FileText,
  Download,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
} from "lucide-react";

export interface ReportPreviewProps {
  report: MonthlyReportData;
  onDownloadPDF: () => void;
  onDownloadCSV: () => void;
  isDownloadingPDF?: boolean;
  isDownloadingCSV?: boolean;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({
  report,
  onDownloadPDF,
  onDownloadCSV,
  isDownloadingPDF = false,
  isDownloadingCSV = false,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Statement Actions Header */}
      <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
              {report.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              Generated on {formatDate(report.generatedAt, { month: "short", day: "numeric", year: "numeric" })} • {report.summary.transactionCount} transactions recorded
            </p>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            onClick={onDownloadPDF}
            disabled={isDownloadingPDF}
            className="text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            <span>{isDownloadingPDF ? "Generating PDF..." : "Download PDF"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadCSV}
            disabled={isDownloadingCSV}
            className="text-xs font-semibold"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
            <span>{isDownloadingCSV ? "Exporting CSV..." : "Download CSV"}</span>
          </Button>
        </div>
      </div>

      {/* 4 Summary Executive Metric Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card/80 space-y-1.5 border-border/80">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Inflows</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold font-mono text-foreground">
            {formatCurrency(report.summary.totalIncome, report.currency)}
          </p>
          <span className="text-[10px] text-muted-foreground">Recorded month revenues</span>
        </Card>

        <Card className="p-4 bg-card/80 space-y-1.5 border-border/80">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total Outflows</span>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold font-mono text-foreground">
            {formatCurrency(report.summary.totalExpenses, report.currency)}
          </p>
          <span className="text-[10px] text-muted-foreground">Recorded month expenses</span>
        </Card>

        <Card className="p-4 bg-card/80 space-y-1.5 border-border/80">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Net Savings</span>
            <Wallet className="h-4 w-4 text-primary" />
          </div>
          <p
            className={`text-xl font-bold font-mono ${
              report.summary.netSavings >= 0 ? "text-foreground" : "text-rose-500"
            }`}
          >
            {formatCurrency(report.summary.netSavings, report.currency)}
          </p>
          <span className="text-[10px] text-muted-foreground">Net surplus / deficit</span>
        </Card>

        <Card className="p-4 bg-card/80 space-y-1.5 border-border/80">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Savings Rate</span>
            <Badge
              variant={
                report.summary.savingsRate >= 25
                  ? "success"
                  : report.summary.savingsRate > 0
                  ? "secondary"
                  : "danger"
              }
              size="sm"
            >
              {report.summary.savingsRate >= 25 ? "Optimal" : report.summary.savingsRate > 0 ? "Moderate" : "Deficit"}
            </Badge>
          </div>
          <p className="text-xl font-bold font-mono text-foreground">
            {report.summary.savingsRate}%
          </p>
          <span className="text-[10px] text-muted-foreground">Savings efficiency index</span>
        </Card>
      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Expense Categories */}
        <Card>
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold">Category Allocation</CardTitle>
            <CardDescription className="text-xs">Outflow distributed across spending categories</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {report.categories.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No expense transactions recorded in this period.
              </div>
            ) : (
              report.categories.slice(0, 6).map((cat) => (
                <div key={cat.categoryId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{formatCurrency(cat.amount, report.currency)}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold">({cat.percentage}%)</span>
                    </div>
                  </div>
                  <Progress value={cat.percentage} max={100} size="sm" variant="primary" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Payment Channels & Accounts */}
        <Card>
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-sm font-bold">Payment Methods & Accounts</CardTitle>
            <CardDescription className="text-xs">Channels and accounts used for settlements</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Payment Channels
              </h4>
              {report.paymentMethods.length === 0 ? (
                <p className="text-xs text-muted-foreground">No payment channels recorded.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {report.paymentMethods.map((pm) => (
                    <div
                      key={pm.method}
                      className="p-2 rounded-lg bg-secondary/50 border border-border/40 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-foreground">{pm.method.replace("_", " ")}</span>
                      <div className="text-right">
                        <p className="font-mono font-bold">{formatCurrency(pm.amount, report.currency)}</p>
                        <span className="text-[9px] text-muted-foreground">{pm.count} txns ({pm.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {report.accounts.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/40">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Account Activity
                </h4>
                <div className="space-y-2">
                  {report.accounts.slice(0, 4).map((acc) => (
                    <div
                      key={acc.accountId}
                      className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-card border border-border/30"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{acc.name}</span>
                      </div>
                      <span className="font-mono font-bold">{formatCurrency(acc.amount, report.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Major Transactions Ledger Table */}
      <Card>
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm font-bold">Statement Transactions Ledger</CardTitle>
          <CardDescription className="text-xs">Top transactions executed during the billing period</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {report.topTransactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No transactions recorded in this period.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-secondary/40 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Account</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {report.topTransactions.map((t) => {
                  const isIncome = t.type === "INCOME";
                  return (
                    <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-4 text-muted-foreground font-mono">
                        {t.date.split("T")[0]}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-foreground">{t.description}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{t.category}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{t.account}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">
                        <span className={isIncome ? "text-emerald-500" : "text-rose-500"}>
                          {isIncome ? "+" : "-"}
                          {formatCurrency(t.amount, report.currency)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
