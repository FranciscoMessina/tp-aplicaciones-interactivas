import { z } from "zod";
import { EnquiryStatus } from "../domain/enquiry.ts";
import { emailSchema, objectIdSchema } from "./common.schema.ts";

const enquiryParams = z.object({ id: objectIdSchema });

export const createEnquirySchema = {
  body: z.object({
    name: z.string().trim().min(1),
    email: emailSchema,
    phone: z.string().trim().min(1).optional(),
    subject: z.string().trim().min(1),
    message: z.string().trim().min(1),
  }),
};

export const updateEnquiryStatusSchema = {
  params: enquiryParams,
  body: z.object({ status: z.enum(EnquiryStatus) }),
};

export const enquiryIdSchema = { params: enquiryParams };
