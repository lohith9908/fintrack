import { api } from "./api";
import {
  MonthlyReportData,
  ReportFilterParams,
  ExportTransactionsFilterParams,
  UserDataExport,
} from "../types/report.types";

export class ReportService {
  /**
   * GET /api/reports/monthly
   */
  public static async getMonthlyReport(
    params: ReportFilterParams = {}
  ): Promise<MonthlyReportData> {
    const queryParams: Record<string, number> = {};
    if (params.month) queryParams.month = params.month;
    if (params.year) queryParams.year = params.year;

    const res = await api.get<{ success: boolean; message: string; data: MonthlyReportData }>(
      "/reports/monthly",
      { params: queryParams }
    );
    return res.data.data;
  }

  /**
   * GET /api/reports/pdf
   * Triggers native browser download of generated PDF statement
   */
  public static async downloadMonthlyPDF(params: ReportFilterParams = {}): Promise<void> {
    const queryParams: Record<string, number> = {};
    if (params.month) queryParams.month = params.month;
    if (params.year) queryParams.year = params.year;

    const res = await api.get("/reports/pdf", {
      params: queryParams,
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `fintrack-statement-${params.year || new Date().getFullYear()}-${String(
        params.month || new Date().getMonth() + 1
      ).padStart(2, "0")}.pdf`
    );
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * GET /api/reports/csv
   * Triggers native browser download of transactions CSV
   */
  public static async downloadTransactionsCSV(
    params: ExportTransactionsFilterParams = {}
  ): Promise<void> {
    const res = await api.get("/reports/csv", {
      params,
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    const dateTag = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `fintrack-transactions-${dateTag}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * GET /api/reports/export-data
   * Triggers native browser download of full sanitized JSON archive
   */
  public static async downloadUserDataArchive(): Promise<UserDataExport> {
    const res = await api.get<{ success: boolean; message: string; data: UserDataExport }>(
      "/reports/export-data"
    );

    const data = res.data.data;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateTag = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `fintrack-data-export-${dateTag}.json`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);

    return data;
  }
}
