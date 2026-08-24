import type { NextFunction, Request, Response } from "express";
import {
  verifyAccessToken,
  type AccessTokenPayload,
} from "../services/auth.service.ts";

export interface AuthenticatedRequest extends Request {
  auth: AccessTokenPayload;
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authorization = req.header("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ message: "A bearer token is required" });
    return;
  }

  try {
    const payload = verifyAccessToken(authorization.slice(7));
    (req as AuthenticatedRequest).auth = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
