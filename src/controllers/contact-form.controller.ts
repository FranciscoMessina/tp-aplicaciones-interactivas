import type { Request, Response } from "express";
import type {
  CreateContactFormInput,
} from "../services/contact-form.service.ts";
import * as contactFormService from "../services/contact-form.service.ts";
import {
  getRequestBody,
  readOptionalNonNegativeNumber,
  readRouteParam,
  readString,
  readTrimmedString,
} from "../utils/validation.ts";
import type { ContactFormStatus } from "../models/contact-form.model.ts";

function getContactFormId(req: Request): string {
  return readRouteParam(req.params.id);
}

export async function getContactForms(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const contactForms = await contactFormService.getContactForms();
    res.status(200).json(contactForms);
  } catch (error) {
    res.status(500).json({ message: String(error) });
  }
}

export async function createContactForm(
  req: Request,
  res: Response,
): Promise<void> {
  const body = getRequestBody(req);
  const name = readTrimmedString(body.name);
  const email = readTrimmedString(body.email);
  const phone = readOptionalNonNegativeNumber(body.phone);
  const subject = readTrimmedString(body.subject);
  const message = readTrimmedString(body.message);
  // dudas removidas porque el estatus nunca viaja como opcion, es algo automatico en la creacion, y ademas lo cambie a un objeto con string.

  if (!name || !email || !subject || message) {
    res.status(400).json({
      message: "name, email, subject, message are required",
    });
    return;
  }

  const input: CreateContactFormInput = {
    name,
    email,
    subject,
    message,
  };
  if (phone !== undefined && phone !== null) {
    input.phone = phone;
  }

  await contactFormService.createContactForm(input);
  res.status(201).json({});
  return;
}

export async function updateContactFormStatus(
  req: Request,
  res: Response,
): Promise<void> {
  const body = getRequestBody(req);
  const status = readString(body.status) as ContactFormStatus | undefined;

  if (!status){
    res.status(400).json({
      message: "status is required",
    });
    return;
  }

  const contactForm = await contactFormService.updateContactFormStatus(
    getContactFormId(req),
    status,
  );
  res.json(contactForm);
}

export async function deleteContacForm(
  req: Request,
  res: Response,
): Promise<void> {
  await contactFormService.deleteContactForm(getContactFormId(req));
  res.status(204).send();
}
