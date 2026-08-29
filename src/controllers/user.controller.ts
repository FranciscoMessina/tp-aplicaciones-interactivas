import type { Request, Response } from "express";
import { handler } from "../http/handler.ts";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "../schemas/user.schema.ts";
import * as userService from "../services/user.service.ts";

export const register = handler(
  { schema: registerSchema },
  async (_req: Request, res: Response, { input }) => {
    res.status(201).json(await userService.registerUser(input.body));
  },
);

export const login = handler(
  { schema: loginSchema },
  async (_req: Request, res: Response, { input }) => {
    res.json(await userService.loginUser(input.body));
  },
);

export const logout = handler(
  { auth: "user" },
  (_req: Request, res: Response) => {
    res.status(204).send();
  },
);

export const getProfile = handler(
  { auth: "user" },
  async (_req: Request, res: Response, { auth }) => {
    res.json({ user: await userService.getUserProfile(auth.sub) });
  },
);

export const updateProfile = handler(
  { schema: updateProfileSchema, auth: "user" },
  async (_req: Request, res: Response, { input, auth }) => {
    res.json({
      user: await userService.updateUserProfile(auth.sub, input.body),
    });
  },
);

export const requestPasswordReset = handler(
  { schema: forgotPasswordSchema },
  async (_req: Request, res: Response, { input }) => {
    const message =
      "If the account exists, password reset instructions have been generated";
    const { resetToken } = await userService.requestPasswordReset(
      input.body.email,
    );
    res.json(resetToken ? { message, resetToken } : { message });
  },
);

export const resetPassword = handler(
  { schema: resetPasswordSchema },
  async (_req: Request, res: Response, { input }) => {
    await userService.resetPassword(input.body.token, input.body.password);
    res.json({ message: "Password updated successfully" });
  },
);
