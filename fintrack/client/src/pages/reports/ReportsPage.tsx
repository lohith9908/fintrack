import React, { useState, useEffect, useCallback } from "react";
import {
  FileSpreadsheet,
  Download,
  RotateCcw,
  ShieldCheck,
  Archive,
  Database,
} from "lucide-react";
import { ReportService } from "../../services/report.service";
import { MonthlyReportData } from "../../types/report.types";
import { useToast } from "../../components/ui/Toast";
import { getErrorMessage } from "../../services/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Skeleton } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/ErrorState";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { ReportPreview } from "../../components/reports/ReportPreview";

export const ReportsPage: React.FC = () => {
  const toast = useToast();
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [year, setYear] = useState<number>(now.getFullYear());
  const [reportType, setReportType] = useState<string>("MONTHLY");

  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isDownloadingPDF, setIsDownloadingPDF] = useState<boolean>(false);
  const [isDownloadingCSV, setIsDownloadingCSV] = useState<boolean>(false);
  const [isExportingData, setIsExportingData] = useState<boolean>(false);
  const [exportDialogOpen, setExportDialogOpen] = useState<boolean>(false);

  const fetchReport = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await ReportService.getMonthlyReport({ month, year });
      setReportData(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDownloadPDF = async () => {
    try {
      setIsDownloadingPDF(true);
      await ReportService.downloadMonthlyPDF({ month, year });
      toast.success("PDF financial statement downloaded successfully", "Downloaded");
    } catch (err) {
      toast.error(getErrorMessage(err), "Download Failed");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      setIsDownloadingCSV(true);
      const startOfMonth = new Date(Date.UTC(year, month - 1, 1)).toISOString();
      const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString();

      await ReportService.downloadTransactionsCSV({
        startDate: startOfMonth,
        endDate: endOfMonth,
      });
      toast.success("CSV transactions ledger downloaded successfully", "Exported");
    } catch (err) {
      toast.error(getErrorMessage(err), "Export Failed");
    } finally {
      setIsDownloadingCSV(false);
    }
  };

  const handleExportUserData = async () => {
    try {
      setIsExportingData(true);
      const archive = await ReportService.downloadUserDataArchive();
      setExportDialogOpen(false);
      toast.success(
        `Exported ${archive.exportMetadata.entityCounts.transactions} transactions, ${archive.exportMetadata.entityCounts.accounts} accounts to JSON`,
        "Archive Generated"
      );
    } catch (err) {
      toast.error(getErrorMessage(err), "Export Failed");
    } finally {
      setIsExportingData(false);
    }
  };

  const monthOptions = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const yearOptions = [
    { value: "2024", label: "2024" },
    { value: "2025", label: "2025" },
    { value: "2026", label: "2026" },
    { value: "2027", label: "2027" },
    { value: "2028", label: "2028" },
  ];

  const reportTypeOptions = [
    { value: "MONTHLY", label: "Monthly Financial Statement" },
    { value: "CATEGORY", label: "Category Spending Breakdown" },
    { value: "CASH_FLOW", label: "Cash Flow & Surplus Analysis" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <FileSpreadsheet className="h-3 w-3" />
            <span>Phase 16 Reports & Data Export</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Reports & Data Export
          </h1>
          <p className="text-xs text-muted-foreground">
            Generate printable PDF financial statements, export structured CSV transaction ledgers, or download complete data archives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReport()}
            disabled={isLoading}
            className="text-xs font-semibold"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            <span>Regenerate</span>
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={() => setExportDialogOpen(true)}
            className="text-xs font-semibold"
          >
            <Archive className="h-3.5 w-3.5 mr-1.5" />
            <span>Export My Data</span>
          </Button>
        </div>
      </div>

      {/* Report Generator Filter Controls Bar */}
      <div className="p-4 rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Report Type</label>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              options={reportTypeOptions}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Month</label>
            <Select
              value={String(month)}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              options={monthOptions}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Year</label>
            <Select
              value={String(year)}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              options={yearOptions}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Main Statement Viewport */}
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-32" />
              </Card>
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to generate financial report"
          message={error}
          onRetry={fetchReport}
        />
      ) : !reportData ? (
        <ErrorState
          title="Report data not found"
          message="Unable to compute financial statement for this selected period."
          onRetry={fetchReport}
        />
      ) : (
        <div className="space-y-8">
          {/* Statement Preview & Download Section */}
          <ReportPreview
            report={reportData}
            onDownloadPDF={handleDownloadPDF}
            onDownloadCSV={handleDownloadCSV}
            isDownloadingPDF={isDownloadingPDF}
            isDownloadingCSV={isDownloadingCSV}
          />

          {/* User Data Archive Export Section */}
          <Card className="border-primary/20 bg-primary/5 shadow-xs">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-primary/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-bold">Complete Financial Data Archive</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Export all your personal ledger records, accounts, budgets, and savings goals into a structured, machine-readable JSON archive.
                </CardDescription>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 shrink-0">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Sanitized & Credentials Excluded</span>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>Includes complete history of:</p>
                <p className="font-semibold text-foreground">
                  Transactions • Accounts • Categories • Monthly Budgets • Recurring Rules • Savings Goals • Notifications
                </p>
                <p className="text-[11px] text-muted-foreground/80">
                  Password hashes, JWT session tokens, and security secrets are strictly stripped for privacy and portability.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportDialogOpen(true)}
                className="text-xs font-semibold shrink-0"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                <span>Export JSON Archive</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Confirmation Dialog for User Data Export */}
      <ConfirmDialog
        isOpen={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        onConfirm={handleExportUserData}
        title="Download Complete Data Archive?"
        message="This will compile all your financial accounts, transactions, budgets, goals, and notification logs into a structured JSON archive file and start the download."
        confirmLabel="Generate & Download"
        variant="primary"
        isLoading={isExportingData}
      />
    </div>
  );
};
