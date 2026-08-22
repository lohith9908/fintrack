import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

// Load .env from workspace root or current directory
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config(); // fallback to current dir

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("5000"),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  MONGO_URI: z.string().default("mongodb://localhost:27017/fintrack"),
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET should be at least 16 characters long")
    .default("fintrack_default_dev_jwt_secret_key_2026"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  BCRYPT_SALT_ROUNDS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("12"),
  COOKIE_SECRET: z.string().default("fintrack_default_dev_cookie_secret"),
  ADMIN_EMAIL: z.string().email().default("admin@fintrack.local"),
  ADMIN_PASSWORD: z.string().min(8).default("AdminSecurePassword123!"),
  UPLOAD_DIR: z.string().default("uploads"),
  MAX_FILE_SIZE: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("5242880"),
  SMTP_HOST: z.string().optional().default("smtp.mailtrap.io"),
  SMTP_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional()
    .default("2525"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASSWORD: z.string().optional().default(""),
  SMTP_FROM: z.string().optional().default("FinTrack <noreply@fintrack.local>"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables configuration:", parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
