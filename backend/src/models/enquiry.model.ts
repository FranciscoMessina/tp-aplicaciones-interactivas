import {
  getModelForClass,
  index,
  modelOptions,
  prop,
} from "@typegoose/typegoose";
import { baseModelOptions } from "./model-options.ts";
import {
  EnquiryStatus,
  type EnquiryStatus as EnquiryStatusValue,
} from "../domain/enquiry.ts";

/**
 * Una respuesta enviada desde el panel. Queda dentro de la consulta: son pocas
 * por consulta y siempre se leen junto con ella.
 */
@modelOptions(baseModelOptions)
export class EnquiryReply {
  @prop({ required: true, trim: true })
  public message!: string;

  // Se guarda el nombre y no una referencia: la respuesta tiene que seguir
  // mostrando quien la escribio aunque esa cuenta se elimine.
  @prop({ required: true, trim: true })
  public authorName!: string;
}

// La bandeja se lee de la mas nueva a la mas vieja, con o sin filtro por
// estado: estos indices evitan ordenar toda la coleccion en cada pagina.
@index({ createdAt: -1 })
@index({ status: 1, createdAt: -1 })
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

  @prop({ type: () => [EnquiryReply], default: [] })
  public replies!: EnquiryReply[];
}

export const EnquiryModel = getModelForClass(Enquiry);
