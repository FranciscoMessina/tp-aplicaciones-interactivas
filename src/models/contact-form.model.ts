import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";
import {
  ContactFormStatus,
  type ContactFormStatus as ContactFormStatusValue,
} from "../domain/contact-form.ts";

@modelOptions({ schemaOptions: { timestamps: true } })
export class ContactForm {
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

  @prop({ enum: ContactFormStatus, default: ContactFormStatus.Pending })
  public status!: ContactFormStatusValue;
}

export const ContactFormModel = getModelForClass(ContactForm);
