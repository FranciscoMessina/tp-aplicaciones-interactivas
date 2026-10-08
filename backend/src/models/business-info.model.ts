import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import { baseModelOptions } from "./model-options.ts";

@modelOptions(baseModelOptions)
export class BusinessInfo {
  @prop({ required: true, trim: true })
  public name!: string;

  @prop({ required: true, trim: true })
  public description!: string;

  @prop({ required: true, trim: true })
  public address!: string;

  @prop({ required: true, trim: true })
  public phone!: string;

  @prop({ type: () => [String], default: [] })
  public socialNetworks!: string[];

  @prop({ type: () => [String], default: [] })
  public openingHours!: string[];
}

export const BusinessInfoModel = getModelForClass(BusinessInfo);
