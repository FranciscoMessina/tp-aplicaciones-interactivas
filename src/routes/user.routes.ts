import { Router } from "express";
import {
  changePassword,
  createAdmin,
  getProfile,
  login,
  logout,
  register,
  requestPasswordReset,
  resetPassword,
  updateProfile,
} from "../controllers/user.controller.ts";
import { authenticate, requireAdmin } from "../middleware/auth.ts";

const userRouter = Router();

userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.post("/logout", authenticate, logout);
userRouter.post("/forgot-password", requestPasswordReset);
userRouter.post("/reset-password", resetPassword);
userRouter.get("/me", authenticate, getProfile);
userRouter.patch("/me", authenticate, updateProfile);
userRouter.patch("/me/password", authenticate, changePassword);
userRouter.post("/admins", authenticate, requireAdmin, createAdmin);

export { userRouter };
