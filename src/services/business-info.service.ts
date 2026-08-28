import type { DocumentType } from "@typegoose/typegoose";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";
import {
  BusinessInfo,
  BusinessInfoModel,
} from "../models/business-info.model.ts";

export interface BusinessInfoInput {
  name: string;
  description: string;
  address: string;
  phone: string;
  socialNetworks: string[];
  openingHours: string[];
}

export async function getBusinessInfo(): Promise<DocumentType<BusinessInfo>> {
  const businessInfo = await BusinessInfoModel.findOne();

  if (!businessInfo) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "Business information not found",
    );
  }

  return businessInfo;
}

export async function upsertBusinessInfo(
  input: BusinessInfoInput,
): Promise<DocumentType<BusinessInfo>> {
  const businessInfo = await BusinessInfoModel.findOneAndUpdate(
    {},
    { $set: input },
    {
      upsert: true,
      returnDocument: "after",
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  if (!businessInfo) {
    throw new ApplicationError(
      ApplicationErrorKind.Unexpected,
      "Could not save business information",
    );
  }

  return businessInfo;
}
