import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authenticate.ts";
import * as userService from "../services/user.service.ts";
import type { UpdateProfileInput } from "../services/user.service.ts";
import {
  getRequestBody,
  isValidEmail,
  normalizeEmail,
  readString,
  readTrimmedString,
} from "../utils/validation.ts";

const MIN_PASSWORD_LENGTH = 8;

function getUserId(req: Request): string {
  return (req as AuthenticatedRequest).auth.sub;
}

export async function register(req: Request, res: Response): Promise<void> {
  const body = getRequestBody(req);
  const fullName = readTrimmedString(body.fullName);
  const email = normalizeEmail(body.email);
  const phone = readTrimmedString(body.phone);
  const password = readString(body.password);

  if (
    !fullName ||
    !isValidEmail(email) ||
    !phone ||
    password.length < MIN_PASSWORD_LENGTH
  ) {
    res.status(400).json({
      message: `fullName, a valid email, phone and a password of at least ${String(MIN_PASSWORD_LENGTH)} characters are required`,
    });
    return;
  }

  const result = await userService.registerUser({
    fullName,
    email,
    phone,
    password,
  });
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = getRequestBody(req);
  const email = normalizeEmail(body.email);
  const password = readString(body.password);

  if (!isValidEmail(email) || !password) {
    res
      .status(400)
      .json({ message: "A valid email and password are required" });
    return;
  }

  const result = await userService.loginUser({ email, password });
  res.json(result);
}

export function logout(_req: Request, res: Response): void {
  res.status(204).send();
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  const user = await userService.getUserProfile(getUserId(req));
  res.json({ user });
}

export async function updateProfile(
  req: Request,
  res: Response,
): Promise<void> {
  const body = getRequestBody(req);
  const updates: UpdateProfileInput = {};

  if (body.fullName !== undefined) {
    updates.fullName = readTrimmedString(body.fullName);
  }
  if (body.phone !== undefined) {
    updates.phone = readTrimmedString(body.phone);
  }
  if (body.email !== undefined) {
    updates.email = normalizeEmail(body.email);
  }

  if (
    Object.keys(updates).length === 0 ||
    (updates.fullName !== undefined && !updates.fullName) ||
    (updates.phone !== undefined && !updates.phone) ||
    (updates.email !== undefined && !isValidEmail(updates.email))
  ) {
    res
      .status(400)
      .json({ message: "Provide a valid fullName, email and/or phone" });
    return;
  }

  const user = await userService.updateUserProfile(getUserId(req), updates);
  res.json({ user });
}

export async function requestPasswordReset(
  req: Request,
  res: Response,
): Promise<void> {
  const email = normalizeEmail(getRequestBody(req).email);
  const message =
    "If the account exists, password reset instructions have been generated";

  if (!isValidEmail(email)) {
    res.json({ message });
    return;
  }

  const { resetToken } = await userService.requestPasswordReset(email);
  res.json(resetToken ? { message, resetToken } : { message });
}

export async function resetPassword(
  req: Request,
  res: Response,
): Promise<void> {
  const body = getRequestBody(req);
  const token = readString(body.token);
  const password = readString(body.password);

  if (!token || password.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({
      message: `A reset token and a password of at least ${String(MIN_PASSWORD_LENGTH)} characters are required`,
    });
    return;
  }

  await userService.resetPassword(token, password);
  res.json({ message: "Password updated successfully" });
}
