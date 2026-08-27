import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { User, PasswordResetToken } from "../models";
import { IUser } from "../types/database.types";
import {
  UpdateProfileInput,
  ChangePasswordInput,
  DeleteAccountInput,
} from "../validators/user.validator";
import {
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
  ForbiddenError,
} from "../utils/apiError";

export class UserService {
  /**
   * Retrieve user profile by ID
   */
  public static async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found.");
    }
    if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
      throw new ForbiddenError("Account is inactive or suspended.");
    }
    return user;
  }

  /**
   * Update user profile fields, preferences, and display settings
   */
  public static async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found.");
    }
    if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
      throw new ForbiddenError("Account is inactive or suspended.");
    }

    if (input.name !== undefined) user.name = input.name.trim();
    if (input.phone !== undefined) user.phone = input.phone.trim();
    if (input.currency !== undefined) user.currency = input.currency.toUpperCase().trim();
    if (input.timezone !== undefined) user.timezone = input.timezone.trim();
    if (input.dateFormat !== undefined) user.dateFormat = input.dateFormat.trim();
    if (input.theme !== undefined) user.theme = input.theme;

    if (input.notificationPreferences !== undefined) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...input.notificationPreferences,
      };
    }

    await user.save();
    return user;
  }

  /**
   * Change user password with current password verification
   */
  public static async changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<{ message: string }> {
    const user = await User.findById(userId).select("+passwordHash");
    if (!user) {
      throw new NotFoundError("User not found.");
    }
    if (user.status === "SUSPENDED" || user.status === "INACTIVE") {
      throw new ForbiddenError("Account is inactive or suspended.");
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      input.currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError("Current password is incorrect.");
    }

    // Prevent reusing the same password
    const isSamePassword = await bcrypt.compare(input.newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new BadRequestError("New password must be different from current password.");
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(input.newPassword, env.BCRYPT_SALT_ROUNDS);
    user.passwordHash = newPasswordHash;
    await user.save();

    // Invalidate any outstanding reset tokens for this user
    await PasswordResetToken.deleteMany({ user: user._id });

    return { message: "Password updated successfully." };
  }

  /**
   * Delete or deactivate user account with password confirmation
   */
  public static async deleteAccount(
    userId: string,
    input: DeleteAccountInput
  ): Promise<{ message: string }> {
    const user = await User.findById(userId).select("+passwordHash");
    if (!user) {
      throw new NotFoundError("User not found.");
    }

    // Verify password confirmation
    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError("Incorrect password. Account deletion aborted.");
    }

    // Delete user and any reset tokens
    await PasswordResetToken.deleteMany({ user: user._id });
    await User.deleteOne({ _id: user._id });

    return { message: "Account deleted successfully." };
  }
}
