import bcrypt from "bcryptjs";
import { env } from "../config/env";
import { connectDatabase, disconnectDatabase } from "../config/db";
import { User, Category } from "../models";
import { logger } from "../utils/logger";
import { TransactionType } from "../types/database.types";

interface SystemCategorySeed {
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export const SYSTEM_CATEGORIES: SystemCategorySeed[] = [
  // Income Categories
  { name: "Salary", type: "INCOME", icon: "Briefcase", color: "#10B981" },
  { name: "Freelancing", type: "INCOME", icon: "Laptop", color: "#3B82F6" },
  { name: "Business", type: "INCOME", icon: "TrendingUp", color: "#6366F1" },
  { name: "Investments", type: "INCOME", icon: "LineChart", color: "#8B5CF6" },
  { name: "Other", type: "INCOME", icon: "PlusCircle", color: "#64748B" },

  // Expense Categories
  { name: "Food", type: "EXPENSE", icon: "Utensils", color: "#EF4444" },
  { name: "Transport", type: "EXPENSE", icon: "Car", color: "#F97316" },
  { name: "Shopping", type: "EXPENSE", icon: "ShoppingBag", color: "#EC4899" },
  { name: "Bills", type: "EXPENSE", icon: "Receipt", color: "#F59E0B" },
  { name: "Education", type: "EXPENSE", icon: "GraduationCap", color: "#06B6D4" },
  { name: "Entertainment", type: "EXPENSE", icon: "Film", color: "#84CC16" },
  { name: "Healthcare", type: "EXPENSE", icon: "HeartPulse", color: "#14B8A6" },
  { name: "Other", type: "EXPENSE", icon: "HelpCircle", color: "#64748B" },
];

export const seedDatabase = async (): Promise<{ adminCreated: boolean; categoriesCreated: number }> => {
  logger.info("🌱 Starting database seeding...");

  let adminCreated = false;
  let categoriesCreated = 0;

  // 1. Seed Default Administrator
  const adminEmail = env.ADMIN_EMAIL.toLowerCase().trim();
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (existingAdmin) {
    logger.info(`ℹ️ Admin user already exists with email: ${adminEmail}`);
  } else {
    logger.info(`🔒 Hashing admin password with ${env.BCRYPT_SALT_ROUNDS} salt rounds...`);
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, env.BCRYPT_SALT_ROUNDS);

    await User.create({
      name: "System Administrator",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      currency: "INR",
      timezone: "Asia/Kolkata",
      dateFormat: "DD/MM/YYYY",
      theme: "system",
      status: "ACTIVE",
      onboardingCompleted: true,
    });

    adminCreated = true;
    logger.info(`✅ Default administrator created successfully: ${adminEmail}`);
  }

  // 2. Seed System Categories
  for (const cat of SYSTEM_CATEGORIES) {
    const existingCategory = await Category.findOne({
      name: cat.name,
      type: cat.type,
      isSystem: true,
      user: null,
    });

    if (!existingCategory) {
      await Category.create({
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        isSystem: true,
        isActive: true,
        user: null,
      });
      categoriesCreated++;
    }
  }

  logger.info(`✅ Seed completed: ${categoriesCreated} new system categories added.`);
  return { adminCreated, categoriesCreated };
};

// Standalone execution entrypoint
if (require.main === module) {
  (async () => {
    try {
      await connectDatabase();
      await seedDatabase();
      await disconnectDatabase();
      logger.info("🎉 Seeding process finished successfully.");
      process.exit(0);
    } catch (error) {
      logger.error("❌ Seeding process failed:", error);
      process.exit(1);
    }
  })();
}
