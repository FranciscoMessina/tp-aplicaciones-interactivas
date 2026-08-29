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

const userRouter = Router();

userRouter.post("/register", register);
userRouter.post("/login", login);
userRouter.post("/logout", logout);
userRouter.post("/forgot-password", requestPasswordReset);
userRouter.post("/reset-password", resetPassword);
userRouter.get("/me", getProfile);
userRouter.patch("/me", updateProfile);

export { userRouter };
