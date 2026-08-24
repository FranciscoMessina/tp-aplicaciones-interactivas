import { Router } from "express";
import {
  getProfile,
  login,
  logout,
  register,
  requestPasswordReset,
  resetPassword,
  updateProfile,
} from "../controllers/user.controller.ts";
import { authenticate } from "../middleware/authenticate.ts";

const userRouter = Router();

userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.post("/logout", authenticate, logout);
userRouter.post("/forgot-password", requestPasswordReset);
userRouter.post("/reset-password", resetPassword);
userRouter.get("/me", authenticate, getProfile);
userRouter.patch("/me", authenticate, updateProfile);

export { userRouter };
