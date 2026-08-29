import type { Request, Response } from "express";
import { handler } from "../http/handler.ts";
import {
  createEnquirySchema,
  enquiryIdSchema,
  updateEnquiryStatusSchema,
} from "../schemas/enquiry.schema.ts";
import * as enquiryService from "../services/enquiry.service.ts";

export const getEnquiries = handler(
  { auth: "admin" },
  async (_req: Request, res: Response) => {
    res.json(await enquiryService.listEnquiries());
  },
);

export const createEnquiry = handler(
  { schema: createEnquirySchema },
  async (_req: Request, res: Response, { input }) => {
    res.status(201).json(await enquiryService.createEnquiry(input.body));
  },
);

export const updateEnquiryStatus = handler(
  { schema: updateEnquiryStatusSchema, auth: "admin" },
  async (_req: Request, res: Response, { input }) => {
    res.json(
      await enquiryService.updateEnquiryStatus(
        input.params.id,
        input.body.status,
      ),
    );
  },
);

export const deleteEnquiry = handler(
  { schema: enquiryIdSchema, auth: "admin" },
  async (_req: Request, res: Response, { input }) => {
    await enquiryService.deleteEnquiry(input.params.id);
    res.status(204).send();
  },
);
