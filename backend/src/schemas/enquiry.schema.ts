import { z } from "zod";
import { EnquiryStatus } from "../domain/enquiry.ts";
import { emailSchema } from "./common.schema.ts";

export const createEnquirySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: emailSchema,
  phone: z.string().trim().min(1).max(40).optional(),
  subject: z.string().trim().min(1).max(150),
  message: z.string().trim().min(1).max(3000),
});

export const listEnquiriesSchema = z.object({
  status: z.enum(EnquiryStatus).optional(),
});

export const updateEnquiryStatusSchema = z.object({
  status: z.enum(EnquiryStatus),
});
