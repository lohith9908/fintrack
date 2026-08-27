import { Router } from "express";
import { AccountController } from "../controllers/account.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// All account routes require authentication
router.use(requireAuth);

router.get("/", AccountController.getAccounts);
router.post("/", AccountController.createAccount);
router.get("/:id", AccountController.getAccountById);
router.patch("/:id", AccountController.updateAccount);
router.post("/:id/deactivate", AccountController.deactivateAccount);
router.delete("/:id", AccountController.deleteAccount);

export const accountRouter = router;
