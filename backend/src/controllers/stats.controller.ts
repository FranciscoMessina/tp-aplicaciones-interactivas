import type { Request, Response } from "express";
import { sendSuccess } from "../http/responses.ts";
import * as statsService from "../services/stats.service.ts";

export async function getDashboardStats(
  _req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(res, await statsService.getDashboardStats());
}
