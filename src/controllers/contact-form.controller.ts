import type { Request, Response } from "express";
import { handler } from "../http/handler.ts";
import {
  contactFormIdSchema,
  createContactFormSchema,
  updateContactFormStatusSchema,
} from "../schemas/contact-form.schema.ts";
import * as contactFormService from "../services/contact-form.service.ts";

export const getContactForms = handler(
  { auth: "admin" },
  async (_req: Request, res: Response) => {
    res.json(await contactFormService.listContactForms());
  },
);

export const createContactForm = handler(
  { schema: createContactFormSchema },
  async (_req: Request, res: Response, { input }) => {
    res
      .status(201)
      .json(await contactFormService.intakeContactForm(input.body));
  },
);

export const updateContactFormStatus = handler(
  { schema: updateContactFormStatusSchema, auth: "admin" },
  async (_req: Request, res: Response, { input }) => {
    res.json(
      await contactFormService.transitionContactForm(
        input.params.id,
        input.body.status,
      ),
    );
  },
);

export const deleteContactForm = handler(
  { schema: contactFormIdSchema, auth: "admin" },
  async (_req: Request, res: Response, { input }) => {
    await contactFormService.discardContactForm(input.params.id);
    res.status(204).send();
  },
);
