import type { Request, Response } from "express";
import { z } from "zod";
import * as businessInfoService from "../services/business-info.service.ts";

const saveBusinessInfoRequestSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1),
    description: z.string().trim().min(1),
    address: z.string().trim().min(1),
    phone: z.string().trim().min(1),
    socialNetworks: z.array(z.url()),
    openingHours: z.array(z.string().trim().min(1)),
  }),
});

export async function getBusinessInfo(
  _req: Request,
  res: Response,
): Promise<void> {
  res.json(await businessInfoService.getBusinessInfo());
}

export async function saveBusinessInfo(
  req: Request,
  res: Response,
): Promise<void> {
  const requestBody: unknown = req.body;
  const { body } = saveBusinessInfoRequestSchema.parse({ body: requestBody });
  res.json(await businessInfoService.upsertBusinessInfo(body));
}
