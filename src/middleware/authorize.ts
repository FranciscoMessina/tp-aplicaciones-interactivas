import type { NextFunction, Request, Response } from "express";
import { UserRole } from "../models/user.model.ts";
import type { AuthenticatedRequest } from "./authenticate.ts";

export function requireRole(
  ...roles: UserRole[]
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { role } = (req as AuthenticatedRequest).auth;

    if (!roles.includes(role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole(UserRole.Admin);
