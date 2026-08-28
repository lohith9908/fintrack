import { Request, Response, NextFunction } from "express";
import { ReportService } from "../services/report.service";
import {
  monthlyReportQuerySchema,
  exportTransactionsQuerySchema,
} from "../validators/report.validator";
import { ApiResponse } from "../utils/apiResponse";

export class ReportController {
  /**
   * GET /api/reports/monthly
   * Get calculated monthly financial statement JSON data
   */
  public static async getMonthlyReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || req.user?._id?.toString();
      if (!userId) {
        ApiResponse.error(res, "Authentication required", [], 401);
        return;
      }

      const parsedQuery = monthlyReportQuerySchema.parse(req.query);
      const report = await ReportService.getMonthlyReport(userId, parsedQuery);

      ApiResponse.success(res, "Monthly report generated successfully", report);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/reports/pdf
   * Download binary PDF document for monthly financial statement
   */
  public static async downloadMonthlyPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || req.user?._id?.toString();
      if (!userId) {
        ApiResponse.error(res, "Authentication required", [], 401);
        return;
      }

      const parsedQuery = monthlyReportQuerySchema.parse(req.query);
      const { buffer, fileName } = await ReportService.getMonthlyReportPDFBuffer(userId, parsedQuery);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Length", buffer.length);

      res.status(200).end(buffer);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/reports/csv
   * Export transactions as CSV file
   */
  public static async exportTransactionsCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || req.user?._id?.toString();
      if (!userId) {
        ApiResponse.error(res, "Authentication required", [], 401);
        return;
      }

      const parsedQuery = exportTransactionsQuerySchema.parse(req.query);
      const { csvContent, fileName } = await ReportService.exportTransactionsCSV(userId, parsedQuery);

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

      res.status(200).send(csvContent);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/reports/export-data
   * Full sanitized user data archive export (JSON)
   */
  public static async exportUserData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id || req.user?._id?.toString();
      if (!userId) {
        ApiResponse.error(res, "Authentication required", [], 401);
        return;
      }

      const dataExport = await ReportService.exportUserData(userId);
      const dateTag = new Date().toISOString().split("T")[0];
      const fileName = `fintrack-data-export-${dateTag}.json`;

      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

      ApiResponse.success(res, "User data archive exported successfully", dataExport);
    } catch (err) {
      next(err);
    }
  }
}
