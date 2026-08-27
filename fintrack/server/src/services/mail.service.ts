import nodemailer from "nodemailer";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export class MailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize or retrieve the nodemailer transporter instance
   */
  private static getTransporter(): nodemailer.Transporter | null {
    if (!this.transporter && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) {
      try {
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT || 2525,
          secure: env.SMTP_PORT === 465,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASSWORD,
          },
        });
      } catch (error) {
        logger.error("Failed to initialize SMTP transporter", error);
        this.transporter = null;
      }
    }
    return this.transporter;
  }

  /**
   * Send password reset email containing the secure one-time reset link
   */
  public static async sendPasswordResetEmail(to: string, rawResetToken: string): Promise<boolean> {
    const resetUrl = `${env.CLIENT_URL}/auth/reset-password?token=${rawResetToken}`;

    const mailOptions = {
      from: env.SMTP_FROM || "FinTrack <noreply@fintrack.local>",
      to,
      subject: "FinTrack — Password Reset Request",
      text: `Hello,\n\nYou requested a password reset for your FinTrack account.\nPlease use the following link to reset your password within 1 hour:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nFinTrack Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a;">FinTrack Password Reset</h2>
          <p style="color: #475569; font-size: 16px;">Hello,</p>
          <p style="color: #475569; font-size: 16px;">You recently requested to reset your password for your FinTrack account. Click the button below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #64748b; font-size: 14px;">This link is valid for <strong>1 hour</strong> and can only be used once.</p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 12px;">If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
      `,
    };

    const transporter = this.getTransporter();
    if (transporter) {
      try {
        await transporter.sendMail(mailOptions);
        logger.info(`✉️ Password reset email dispatched via SMTP to ${to}`);
        return true;
      } catch (error) {
        logger.error(`Failed to send password reset email via SMTP to ${to}`, error);
        return false;
      }
    } else {
      // In development / testing without active SMTP credentials, log the reset URL securely for debugging
      logger.info(`📧 [Development/Test Mailer] Password reset link for ${to}: ${resetUrl}`);
      return true;
    }
  }
}
