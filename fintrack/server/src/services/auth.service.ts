import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { User, PasswordResetToken } from "../models";
import { IUser } from "../types/database.types";
import { RegisterInput, LoginInput, ResetPasswordInput } from "../validators/auth.validator";
import { MailService } from "./mail.service";
import { signToken } from "../utils/jwt";
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from "../utils/apiError";

export interface AuthResult {
  user: IUser;
  token: string;
}

export class AuthService {
  /**
   * Register a new user with bcrypt-hashed password and generate session token
   */
  public static async registerUser(input: RegisterInput): Promise<AuthResult> {
    const email = input.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ConflictError("An account with this email address already exists.");
    }

    // Hash password with configured salt rounds
    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

    // Create user in database
    const user = await User.create({
      name: input.name.trim(),
      email,
      passwordHash,
      role: "USER",
      currency: "INR",
      timezone: "Asia/Kolkata",
      dateFormat: "DD/MM/YYYY",
      theme: "system",
      status: "ACTIVE",
      onboardingCompleted: false,
    });

    // Generate JWT token
    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  /**
   * Authenticate user with email and password and generate session token
   */
  public static async loginUser(input: LoginInput): Promise<AuthResult> {
    const email = input.email.toLowerCase().trim();

    // Find user with passwordHash included
    const user = await User.findOne({ email }).select("+passwordHash");

    // Generic safe error message to prevent user enumeration
    if (!user) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    // Check account status
    if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
      throw new ForbiddenError("Your account is currently inactive or suspended. Please contact support.");
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Invalid email or password.");
    }

    // Update last login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT token
    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  /**
   * Retrieve current authenticated user profile
   */
  public static async getCurrentUser(userId: string): Promise<IUser> {
    const user = await User.findById(userId);

    if (!user) {
      throw new NotFoundError("User profile not found.");
    }

    if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
      throw new ForbiddenError("Account is inactive or suspended.");
    }

    return user;
  }

  /**
   * Request password recovery token (safe against user enumeration)
   */
  public static async forgotPassword(email: string): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (user && user.status === "ACTIVE") {
      // 1. Generate cryptographically secure random token (32 bytes = 64 hex chars)
      const rawToken = crypto.randomBytes(32).toString("hex");

      // 2. Hash token using SHA-256 for secure storage & lookup
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      // 3. Set expiration to 1 hour (3600000 ms)
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      // 4. Invalidate/delete any previous reset tokens for this user
      await PasswordResetToken.deleteMany({ user: user._id });

      // 5. Store new hashed token in database
      await PasswordResetToken.create({
        user: user._id,
        tokenHash,
        expiresAt,
        createdAt: new Date(),
      });

      // 6. Send password reset email with raw token in link
      await MailService.sendPasswordResetEmail(user.email, rawToken);
    }

    // Always return safe generic message to prevent account enumeration
    return {
      message: "If that email address is registered with us, you will receive password reset instructions.",
    };
  }

  /**
   * Reset user password using a valid, non-expired, single-use reset token
   */
  public static async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const rawToken = input.token.trim();
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // 1. Look up token by SHA-256 hash
    const resetTokenDoc = await PasswordResetToken.findOne({ tokenHash });

    if (!resetTokenDoc) {
      throw new BadRequestError("Invalid or expired password reset token.");
    }

    // 2. Check if token was already used (one-time use enforcement)
    if (resetTokenDoc.usedAt) {
      throw new BadRequestError("Invalid or expired password reset token.");
    }

    // 3. Check if token has expired
    if (resetTokenDoc.expiresAt.getTime() < Date.now()) {
      throw new BadRequestError("Invalid or expired password reset token.");
    }

    // 4. Fetch associated user
    const user = await User.findById(resetTokenDoc.user).select("+passwordHash");
    if (!user) {
      throw new BadRequestError("Invalid or expired password reset token.");
    }

    if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
      throw new ForbiddenError("Account is inactive or suspended.");
    }

    // 5. Hash new password with configured bcrypt salt rounds
    const newPasswordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

    // 6. Update user password
    user.passwordHash = newPasswordHash;
    await user.save();

    // 7. Mark token as used to prevent reuse
    resetTokenDoc.usedAt = new Date();
    await resetTokenDoc.save();

    // 8. Invalidate any remaining reset tokens for this user
    await PasswordResetToken.deleteMany({
      user: user._id,
      _id: { $ne: resetTokenDoc._id },
    });

    return {
      message: "Password reset successful. Please log in with your new password.",
    };
  }
}
