import bcrypt from "bcryptjs";
import { signToken, verifyToken } from "../utils/jwt";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { User } from "../models/User.model";
import { AUTH_COOKIE_NAME } from "../utils/cookies";

export const verifyAuthUnit = async (): Promise<boolean> => {
  console.log("=== 1. Testing Input Validation (Zod) ===");

  // Registration Validation
  const invalidRegister = registerSchema.safeParse({
    name: "A", // too short
    email: "invalid-email",
    password: "short",
  });
  if (invalidRegister.success) {
    throw new Error("Register schema failed to reject invalid input");
  }
  console.log("✓ Register validation correctly rejected short name, invalid email, and short password");

  const validRegister = registerSchema.safeParse({
    name: "John Doe",
    email: "john.doe@example.com",
    password: "Password123!",
    confirmPassword: "Password123!",
  });
  if (!validRegister.success) {
    throw new Error(`Register schema rejected valid input: ${JSON.stringify(validRegister.error.format())}`);
  }
  console.log("✓ Register validation accepted valid payload");

  // Login Validation
  const invalidLogin = loginSchema.safeParse({
    email: "not-an-email",
    password: "",
  });
  if (invalidLogin.success) {
    throw new Error("Login schema failed to reject invalid input");
  }
  console.log("✓ Login validation correctly rejected empty password and invalid email");

  console.log("\n=== 2. Testing Password Security (Bcrypt) ===");
  const plainPassword = "SecurePassword123!";
  const saltRounds = 10;
  const hash = await bcrypt.hash(plainPassword, saltRounds);
  const isMatch = await bcrypt.compare(plainPassword, hash);
  const isWrongMatch = await bcrypt.compare("WrongPassword", hash);

  if (!isMatch || isWrongMatch) {
    throw new Error("Bcrypt password comparison logic failed");
  }
  console.log("✓ Bcrypt hashing and comparison functioning securely");

  console.log("\n=== 3. Testing JWT Signing and Verification ===");
  const testPayload = {
    id: "507f1f77bcf86cd799439011",
    email: "john.doe@example.com",
    role: "USER" as const,
  };
  const token = signToken(testPayload);
  const decoded = verifyToken(token);

  if (decoded.id !== testPayload.id || decoded.email !== testPayload.email || decoded.role !== testPayload.role) {
    throw new Error("Decoded JWT payload does not match source payload");
  }
  console.log("✓ JWT signing and verification verified successfully");

  console.log("\n=== 4. Testing Cookie Configuration ===");
  if (AUTH_COOKIE_NAME !== "fintrack_token") {
    throw new Error(`Unexpected auth cookie name: ${AUTH_COOKIE_NAME}`);
  }
  console.log(`✓ Auth cookie configured with name: "${AUTH_COOKIE_NAME}"`);

  console.log("\n=== 5. Testing User Model Password Security ===");
  const user = new User({
    name: "Jane Doe",
    email: "jane.doe@example.com",
    passwordHash: hash,
    role: "USER",
  });
  const jsonUser = user.toJSON();
  if ("passwordHash" in jsonUser) {
    throw new Error("User.toJSON() leaked passwordHash");
  }
  console.log("✓ User model serialization completely strips passwordHash");

  console.log("\n✅ All Authentication and Password Security unit tests passed!");
  return true;
};

if (require.main === module) {
  verifyAuthUnit().catch((err) => {
    console.error("❌ Auth test error:", err);
    process.exit(1);
  });
}
