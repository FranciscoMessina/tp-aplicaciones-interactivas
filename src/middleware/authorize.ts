import type { NextFunction, Request, Response } from "express";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";
import { UserRole } from "../models/user.model.ts";
import type { AuthenticatedRequest } from "./authenticate.ts";

export function requireRole(
  ...roles: UserRole[]
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { role } = (req as AuthenticatedRequest).auth;

    if (!roles.includes(role)) {
      next(
        new ApplicationError(
          ApplicationErrorKind.Forbidden,
          "Insufficient permissions",
        ),
      );
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole(UserRole.Admin);
