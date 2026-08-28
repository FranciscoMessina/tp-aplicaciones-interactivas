import type { DocumentType } from "@typegoose/typegoose";
import {
  ContactForm,
  ContactFormModel,
  ContactFormStatus,
} from "../models/contact-form.model.ts";
import { HttpError } from "../utils/http-error.ts";

export interface CreateContactFormInput {
  name: string;
  email: string;
  phone?: number;
  subject: string;
  message: string;
}

export async function getContactForms(): Promise<DocumentType<ContactForm>[]> {
  try {
    const contactForms = await ContactFormModel.find();
    return contactForms;
  } catch (error) {
    console.error(error);
    throw new HttpError(500, "Error al obtener los formularios de contacto");
  }
}

export async function createContactForm(
  input: CreateContactFormInput,
): Promise<DocumentType<ContactForm>> {
  return ContactFormModel.create(input);
}

export async function updateContactFormStatus(
  contactFormId: string,
  status: ContactFormStatus,
): Promise<DocumentType<ContactForm>> {
  const contactForm = await ContactFormModel.findByIdAndUpdate(
    contactFormId,
    { $set: { status } },
    { returnDocument: "after", runValidators: true },
  );

  if (!contactForm) {
    throw new HttpError(404, "ContactForm not found");
  }

  return contactForm;
}

export async function deleteContactForm(contactFormId: string): Promise<void> {
  const contactForm = await ContactFormModel.findByIdAndDelete(contactFormId);

  if (!contactForm) {
    throw new HttpError(404, "ContactForm not found");
  }
}
