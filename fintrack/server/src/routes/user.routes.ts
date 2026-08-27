import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import {
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from "../validators/user.validator";

const router = Router();

// All user routes require authentication
router.use(requireAuth);

router.get("/me", UserController.getProfile);
router.patch("/profile", validateBody(updateProfileSchema), UserController.updateProfile);
router.post(
  "/change-password",
  validateBody(changePasswordSchema),
  UserController.changePassword
);
router.delete(
  "/me",
  validateBody(deleteAccountSchema),
  UserController.deleteAccount
);

export default router;
