import { Router } from "express";
import {
  changePassword,
  createUser,
  deleteUser,
  getProfile,
  listUsers,
  login,
  logout,
  requestPasswordReset,
  resetPassword,
  updateProfile,
} from "../controllers/user.controller.ts";
import { authenticate, requireAdmin } from "../middleware/auth.ts";
import {
  forgotPasswordLimiter,
  loginLimiter,
  resetPasswordLimiter,
} from "../middleware/rate-limit.ts";

const userRouter = Router();

// No hay registro publico: las cuentas las crea un administrador.
userRouter.get("/", authenticate, requireAdmin, listUsers);
userRouter.post("/", authenticate, requireAdmin, createUser);
userRouter.delete("/:id", authenticate, requireAdmin, deleteUser);
userRouter.post("/login", loginLimiter, login);
userRouter.post("/logout", authenticate, logout);
userRouter.post(
  "/forgot-password",
  forgotPasswordLimiter,
  requestPasswordReset,
);
userRouter.post("/reset-password", resetPasswordLimiter, resetPassword);
userRouter.get("/me", authenticate, getProfile);
userRouter.patch("/me", authenticate, updateProfile);
userRouter.patch("/me/password", authenticate, changePassword);

export { userRouter };
