import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { requireAuth } from "../middlewares/auth.middleware";

export const reportRouter = Router();

// Enforce authentication across all report and data export routes
reportRouter.use(requireAuth);

/**
 * @route   GET /api/reports/monthly
 * @desc    Get monthly financial statement JSON data
 * @access  Private
 */
reportRouter.get("/monthly", ReportController.getMonthlyReport);

/**
 * @route   GET /api/reports/pdf
 * @desc    Download monthly financial statement as PDF
 * @access  Private
 */
reportRouter.get("/pdf", ReportController.downloadMonthlyPDF);

/**
 * @route   GET /api/reports/csv
 * @desc    Download transactions as CSV file
 * @access  Private
 */
reportRouter.get("/csv", ReportController.exportTransactionsCSV);

/**
 * @route   GET /api/reports/export-data
 * @desc    Download full sanitized user data archive as JSON
 * @access  Private
 */
reportRouter.get("/export-data", ReportController.exportUserData);
