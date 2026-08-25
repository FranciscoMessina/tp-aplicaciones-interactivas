import type { DocumentType } from "@typegoose/typegoose";
import {
  BusinessInfo,
  BusinessInfoModel,
} from "../models/business-info.model.ts";
import { HttpError } from "../utils/http-error.ts";

export interface BusinessInfoInput {
  name: string;
  description: string;
  address: string;
  phone: string;
  socialNetworks: string[];
  openingHours: string[];
}

export function getBusinessInfo(): Promise<DocumentType<BusinessInfo> | null> {
  return BusinessInfoModel.findOne();
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
    throw new HttpError(500, "Could not save business information");
  }

  return businessInfo;
}