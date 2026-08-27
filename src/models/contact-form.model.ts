import {
  getModelForClass,
  modelOptions,
  prop,
} from "@typegoose/typegoose";

export const ContactFormStatus = {
  Pending: "PENDIENTE",
  Read: "LEIDA",
  Resolved: "RESUELTA",
};

export type ContactFormStatus =
  (typeof ContactFormStatus)[keyof typeof ContactFormStatus];

@modelOptions({ schemaOptions: { timestamps: true } })
export class ContactForm {
  @prop({ required: true, trim: true })
  public name!: string;

  @prop({ required: true, lowercase: true, trim: true })
  public email!: string;

  @prop({ trim: true })
  public phone?: number;

  @prop({ required: true, trim: true })
  public subject!: string;

  @prop({ required: true, trim: true })
  public message!: string;

  @prop({ enum: ContactFormStatus, default: ContactFormStatus.Pending })
  public status!: ContactFormStatus;
}

export const ContactFormModel = getModelForClass(ContactForm);
