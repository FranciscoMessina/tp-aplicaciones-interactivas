import { z } from "zod";
import { EnquiryStatus } from "../domain/enquiry.ts";
import { emailSchema } from "./common.schema.ts";

export const createEnquirySchema = z.object({
  name: z.string().trim().min(1),
  email: emailSchema,
  phone: z.string().trim().min(1).optional(),
  subject: z.string().trim().min(1),
  message: z.string().trim().min(1),
});

export const updateEnquiryStatusSchema = z.object({
  status: z.enum(EnquiryStatus),
});
