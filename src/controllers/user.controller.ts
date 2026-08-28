import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "../middleware/authenticate.ts";
import * as userService from "../services/user.service.ts";
import type { UpdateProfileInput } from "../services/user.service.ts";

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

const registerRequestSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(1),
    email: emailSchema,
    phone: z.string().trim().min(1),
    password: z.string().min(8),
  }),
});

const loginRequestSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1),
  }),
});

const updateProfileRequestSchema = z.object({
  body: z
    .object({
      fullName: z.string().trim().min(1).optional(),
      email: emailSchema.optional(),
      phone: z.string().trim().min(1).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: "Provide at least one field",
    }),
});

const forgotPasswordRequestSchema = z.object({
  body: z.object({ email: emailSchema }),
});

const resetPasswordRequestSchema = z.object({
  body: z.object({
    token: z.string().trim().min(1),
    password: z.string().min(8),
  }),
});

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).auth.sub;
}

export async function register(req: Request, res: Response): Promise<void> {
  const requestBody: unknown = req.body;
  const { body } = registerRequestSchema.parse({ body: requestBody });
  res.status(201).json(await userService.registerUser(body));
}

export async function login(req: Request, res: Response): Promise<void> {
  const requestBody: unknown = req.body;
  const { body } = loginRequestSchema.parse({ body: requestBody });
  res.json(await userService.loginUser(body));
}

export function logout(_req: Request, res: Response): void {
  res.status(204).send();
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  res.json({ user: await userService.getUserProfile(getUserId(req)) });
}

export async function updateProfile(
  req: Request,
  res: Response,
): Promise<void> {
  const requestBody: unknown = req.body;
  const { body } = updateProfileRequestSchema.parse({ body: requestBody });
  const updates: UpdateProfileInput = {
    ...(body.fullName !== undefined ? { fullName: body.fullName } : {}),
    ...(body.email !== undefined ? { email: body.email } : {}),
    ...(body.phone !== undefined ? { phone: body.phone } : {}),
  };
  res.json({
    user: await userService.updateUserProfile(getUserId(req), updates),
  });
}

export async function requestPasswordReset(
  req: Request,
  res: Response,
): Promise<void> {
  const requestBody: unknown = req.body;
  const { body } = forgotPasswordRequestSchema.parse({ body: requestBody });
  const message =
    "If the account exists, password reset instructions have been generated";
  const { resetToken } = await userService.requestPasswordReset(body.email);
  res.json(resetToken ? { message, resetToken } : { message });
}

export async function resetPassword(
  req: Request,
  res: Response,
): Promise<void> {
  const requestBody: unknown = req.body;
  const { body } = resetPasswordRequestSchema.parse({ body: requestBody });
  await userService.resetPassword(body.token, body.password);
  res.json({ message: "Password updated successfully" });
}
