import { z } from "zod";
import { ContactFormStatus } from "../domain/contact-form.ts";
import { emailSchema, objectIdSchema } from "./common.schema.ts";

const contactFormParams = z.object({ id: objectIdSchema });

export const createContactFormSchema = {
  body: z.object({
    name: z.string().trim().min(1),
    email: emailSchema,
    phone: z.string().trim().min(1).optional(),
    subject: z.string().trim().min(1),
    message: z.string().trim().min(1),
  }),
};
export const updateContactFormStatusSchema = {
  params: contactFormParams,
  body: z.object({ status: z.enum(ContactFormStatus) }),
};
export const contactFormIdSchema = { params: contactFormParams };
