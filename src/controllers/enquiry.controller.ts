import type { Request, Response } from "express";
import { sendSuccess } from "../http/responses.ts";
import { validate } from "../http/validate.ts";
import { idParamsSchema } from "../schemas/common.schema.ts";
import {
  createEnquirySchema,
  listEnquiriesSchema,
  updateEnquiryStatusSchema,
} from "../schemas/enquiry.schema.ts";
import * as enquiryService from "../services/enquiry.service.ts";

export async function listEnquiries(
  req: Request,
  res: Response,
): Promise<void> {
  const { status } = validate(listEnquiriesSchema, req.query);
  sendSuccess(res, await enquiryService.listEnquiries(status));
}

export async function createEnquiry(
  req: Request,
  res: Response,
): Promise<void> {
  const body = validate(createEnquirySchema, req.body);
  sendSuccess(res, await enquiryService.createEnquiry(body), 201);
}

export async function updateEnquiryStatus(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validate(idParamsSchema, req.params);
  const { status } = validate(updateEnquiryStatusSchema, req.body);
  sendSuccess(res, await enquiryService.updateEnquiryStatus(id, status));
}

export async function deleteEnquiry(
  req: Request,
  res: Response,
): Promise<void> {
  const { id } = validate(idParamsSchema, req.params);
  await enquiryService.deleteEnquiry(id);
  res.status(204).send();
}
