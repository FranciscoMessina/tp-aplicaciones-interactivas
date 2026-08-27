import {
    getModelForClass,
    modelOptions,
    prop,
    type Ref,
} from "@typegoose/typegoose";

@modelOptions({ schemaOptions: { timestamps: true } })

export enum ContactFormStatus {
    PENDIENTE = "PENDIENTE",
    LEIDA = "LEIDA",
    RESUELTA = "RESUELTA",
}
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

    @prop({ enum: ContactFormStatus, default: ContactFormStatus.PENDIENTE })
    public status!: ContactFormStatus;

}

export const ContactFormModel = getModelForClass(ContactForm);