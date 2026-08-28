import type { Request, Response } from "express";
import { z } from "zod";
import { ContactFormStatus } from "../domain/contact-form.ts";
import * as contactFormService from "../services/contact-form.service.ts";
import type { CreateContactFormInput } from "../services/contact-form.service.ts";

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid identifier");
const emailSchema = z.string().trim().toLowerCase().pipe(z.email());
const createContactFormRequestSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1),
    email: emailSchema,
    phone: z.string().trim().min(1).optional(),
    subject: z.string().trim().min(1),
    message: z.string().trim().min(1),
  }),
});
const updateContactFormStatusRequestSchema = z.object({
  params: z.object({ id: objectIdSchema }),
  body: z.object({ status: z.enum(ContactFormStatus) }),
});
const contactFormIdRequestSchema = z.object({
  params: z.object({ id: objectIdSchema }),
});

export async function getContactForms(
  _req: Request,
  res: Response,
): Promise<void> {
  const contactForm = await contactFormService.listContactForms();

  res.json(contactForm);
}

export async function createContactForm(
  req: Request,
  res: Response,
): Promise<void> {
  const requestBody: unknown = req.body;
  const { body } = createContactFormRequestSchema.parse({ body: requestBody });
  const input: CreateContactFormInput = {
    name: body.name,
    email: body.email,
    ...(body.phone !== undefined ? { phone: body.phone } : {}),
    subject: body.subject,
    message: body.message,
  };
  res.status(201).json(await contactFormService.intakeContactForm(input));
}

export async function updateContactFormStatus(
  req: Request,
  res: Response,
): Promise<void> {
  const requestBody: unknown = req.body;
  const { params, body } = updateContactFormStatusRequestSchema.parse({
    params: req.params,
    body: requestBody,
  });
  res.json(
    await contactFormService.transitionContactForm(params.id, body.status),
  );
}

export async function deleteContactForm(
  req: Request,
  res: Response,
): Promise<void> {
  const { params } = contactFormIdRequestSchema.parse({ params: req.params });
  await contactFormService.discardContactForm(params.id);
  res.status(204).send();
}
