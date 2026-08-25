import {
  getModelForClass,
  modelOptions,
  prop,
} from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { timestamps: true } })
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