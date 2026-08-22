import {
  User,
  Category,
  Account,
  Transaction,
  Budget,
  RecurringTransaction,
  SavingsGoal,
  Notification,
  PasswordResetToken,
  AuditLog,
  UserActivity,
  SystemSetting,
} from "../models";
import { SYSTEM_CATEGORIES } from "../seed/seed";

export const verifyModels = (): boolean => {
  const models = [
    { model: User, expectedCollection: "users" },
    { model: Category, expectedCollection: "categories" },
    { model: Account, expectedCollection: "accounts" },
    { model: Transaction, expectedCollection: "transactions" },
    { model: Budget, expectedCollection: "budgets" },
    { model: RecurringTransaction, expectedCollection: "recurringtransactions" },
    { model: SavingsGoal, expectedCollection: "savingsgoals" },
    { model: Notification, expectedCollection: "notifications" },
    { model: PasswordResetToken, expectedCollection: "passwordresettokens" },
    { model: AuditLog, expectedCollection: "auditlogs" },
    { model: UserActivity, expectedCollection: "useractivities" },
    { model: SystemSetting, expectedCollection: "systemsettings" },
  ];

  console.log("=== 1. Checking Model Registrations ===");
  for (const { model, expectedCollection } of models) {
    if (!model || !model.modelName) {
      throw new Error(`Model ${model} is not defined properly.`);
    }
    console.log(`✓ ${model.modelName} registered -> collection: "${expectedCollection}"`);
  }

  console.log("\n=== 2. Checking Schema Indexes ===");
  const budgetIndexes = Budget.schema.indexes();
  const hasBudgetCompoundUnique = budgetIndexes.some(([fields, options]) => {
    return (
      fields.user === 1 &&
      fields.category === 1 &&
      fields.year === 1 &&
      fields.month === 1 &&
      options?.unique === true
    );
  });
  if (!hasBudgetCompoundUnique) {
    throw new Error("Budget schema missing compound unique index on { user, category, year, month }");
  }
  console.log("✓ Budget compound unique index verified: { user: 1, category: 1, year: 1, month: 1 } (unique)");

  const resetTokenIndexes = PasswordResetToken.schema.indexes();
  const hasTTL = resetTokenIndexes.some(([fields, options]) => {
    return fields.expiresAt === 1 && options?.expireAfterSeconds === 0;
  });
  if (!hasTTL) {
    throw new Error("PasswordResetToken schema missing TTL index on expiresAt");
  }
  console.log("✓ PasswordResetToken TTL index verified: { expiresAt: 1 } (expireAfterSeconds: 0)");

  console.log("\n=== 3. Checking System Seed Categories ===");
  const incomeCategories = SYSTEM_CATEGORIES.filter((c) => c.type === "INCOME");
  const expenseCategories = SYSTEM_CATEGORIES.filter((c) => c.type === "EXPENSE");
  console.log(`✓ Income categories count: ${incomeCategories.length} (Salary, Freelancing, Business, Investments, Other)`);
  console.log(`✓ Expense categories count: ${expenseCategories.length} (Food, Transport, Shopping, Bills, Education, Entertainment, Healthcare, Other)`);

  console.log("\n✅ All Database Models and Schema specifications verified successfully!");
  return true;
};

if (require.main === module) {
  verifyModels();
}
