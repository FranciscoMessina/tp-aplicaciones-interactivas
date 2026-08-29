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

export function listEnquiries(): Promise<DocumentType<Enquiry>[]> {
  return EnquiryModel.find();
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
      "Enquiry not found",
    );
  }

  if (enquiry.status === nextStatus) {
    return enquiry;
  }

  if (!allowedTransitions[enquiry.status].includes(nextStatus)) {
    throw new ApplicationError(
      ApplicationErrorKind.Conflict,
      `Cannot transition enquiry from ${enquiry.status} to ${nextStatus}`,
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
      "Enquiry not found",
    );
  }
}

const allowedTransitions: Record<EnquiryStatusValue, EnquiryStatusValue[]> = {
  [EnquiryStatus.Pending]: [EnquiryStatus.Read, EnquiryStatus.Resolved],
  [EnquiryStatus.Read]: [EnquiryStatus.Resolved],
  [EnquiryStatus.Resolved]: [],
};
