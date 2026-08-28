import type { DocumentType } from "@typegoose/typegoose";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";
import {
  ContactFormStatus,
  type ContactFormStatus as ContactFormStatusValue,
} from "../domain/contact-form.ts";
import { ContactForm, ContactFormModel } from "../models/contact-form.model.ts";

export interface CreateContactFormInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export function listContactForms(): Promise<DocumentType<ContactForm>[]> {
  return ContactFormModel.find();
}

export function intakeContactForm(
  input: CreateContactFormInput,
): Promise<DocumentType<ContactForm>> {
  return ContactFormModel.create({
    ...input,
    status: ContactFormStatus.Pending,
  });
}

export async function transitionContactForm(
  contactFormId: string,
  nextStatus: ContactFormStatusValue,
): Promise<DocumentType<ContactForm>> {
  const contactForm = await ContactFormModel.findById(contactFormId);

  if (!contactForm) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "Contact form not found",
    );
  }

  if (contactForm.status === nextStatus) {
    return contactForm;
  }

  if (!allowedTransitions[contactForm.status].includes(nextStatus)) {
    throw new ApplicationError(
      ApplicationErrorKind.Conflict,
      `Cannot transition contact form from ${contactForm.status} to ${nextStatus}`,
    );
  }

  contactForm.status = nextStatus;
  return contactForm.save();
}

export async function discardContactForm(contactFormId: string): Promise<void> {
  const contactForm = await ContactFormModel.findByIdAndDelete(contactFormId);

  if (!contactForm) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "Contact form not found",
    );
  }
}

const allowedTransitions: Record<
  ContactFormStatusValue,
  ContactFormStatusValue[]
> = {
  [ContactFormStatus.Pending]: [
    ContactFormStatus.Read,
    ContactFormStatus.Resolved,
  ],
  [ContactFormStatus.Read]: [ContactFormStatus.Resolved],
  [ContactFormStatus.Resolved]: [],
};
