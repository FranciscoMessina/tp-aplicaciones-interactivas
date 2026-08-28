import type { NextFunction, Request, Response } from "express";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";
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
    next(
      new ApplicationError(
        ApplicationErrorKind.Unauthenticated,
        "A bearer token is required",
      ),
    );
    return;
  }

  try {
    const payload = verifyAccessToken(authorization.slice(7));
    (req as AuthenticatedRequest).auth = payload;
    next();
  } catch {
    next(
      new ApplicationError(
        ApplicationErrorKind.Unauthenticated,
        "Invalid or expired token",
      ),
    );
  }
}
