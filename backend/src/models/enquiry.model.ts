import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { baseModelOptions } from "./model-options.ts";
import {
  EnquiryStatus,
  type EnquiryStatus as EnquiryStatusValue,
} from "../domain/enquiry.ts";

@modelOptions(baseModelOptions)
export class Enquiry {
  @prop({ required: true, trim: true })
  public name!: string;

  @prop({ required: true, lowercase: true, trim: true })
  public email!: string;

  @prop({ trim: true })
  public phone?: string;

  @prop({ required: true, trim: true })
  public subject!: string;

  @prop({ required: true, trim: true })
  public message!: string;

  @prop({ enum: EnquiryStatus, default: EnquiryStatus.Pending })
  public status!: EnquiryStatusValue;
}

export const EnquiryModel = getModelForClass(Enquiry);
