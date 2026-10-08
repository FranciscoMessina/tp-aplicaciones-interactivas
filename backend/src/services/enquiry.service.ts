import type { DocumentType } from "@typegoose/typegoose";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";
import {
  EnquiryStatus,
  type EnquiryStatus as EnquiryStatusValue,
} from "../domain/enquiry.ts";
import { Enquiry, EnquiryModel } from "../models/enquiry.model.ts";

export interface CreateEnquiryInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export function listEnquiries(
  status?: EnquiryStatusValue,
): Promise<DocumentType<Enquiry>[]> {
  return EnquiryModel.find(status ? { status } : {}).sort({ createdAt: -1 });
}

export function createEnquiry(
  input: CreateEnquiryInput,
): Promise<DocumentType<Enquiry>> {
  return EnquiryModel.create({
    ...input,
    status: EnquiryStatus.Pending,
  });
}

export async function updateEnquiryStatus(
  enquiryId: string,
  nextStatus: EnquiryStatusValue,
): Promise<DocumentType<Enquiry>> {
  const enquiry = await EnquiryModel.findById(enquiryId);

  if (!enquiry) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró la consulta",
    );
  }

  if (enquiry.status === nextStatus) {
    return enquiry;
  }

  if (!allowedTransitions[enquiry.status].includes(nextStatus)) {
    throw new ApplicationError(
      ApplicationErrorKind.Conflict,
      `No se puede cambiar una consulta de ${enquiry.status} a ${nextStatus}`,
    );
  }

  enquiry.status = nextStatus;
  return enquiry.save();
}

export async function deleteEnquiry(enquiryId: string): Promise<void> {
  const enquiry = await EnquiryModel.findByIdAndDelete(enquiryId);

  if (!enquiry) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró la consulta",
    );
  }
}

/**
 * A que estados puede pasar una consulta desde cada estado. Siempre se puede
 * volver a pendiente, por ejemplo para retomar una consulta; lo unico que no
 * se permite es "des-responder" una consulta y dejarla como solo leida.
 */
const allowedTransitions: Record<EnquiryStatusValue, EnquiryStatusValue[]> = {
  [EnquiryStatus.Pending]: [EnquiryStatus.Read, EnquiryStatus.Resolved],
  [EnquiryStatus.Read]: [EnquiryStatus.Pending, EnquiryStatus.Resolved],
  [EnquiryStatus.Resolved]: [EnquiryStatus.Pending],
};
