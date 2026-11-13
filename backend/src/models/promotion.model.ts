import {
  getModelForClass,
  modelOptions,
  prop,
  type Ref,
} from "@typegoose/typegoose";
import { Category } from "./category.model.ts";
import { Collection } from "./collection.model.ts";
import { baseModelOptions } from "./model-options.ts";

/**
 * Un aviso que se muestra en el inicio, como "Semana del audio". Si lleva a
 * una coleccion puede aplicarle un descuento a todos sus productos.
 */
@modelOptions(baseModelOptions)
export class Promotion {
  @prop({ required: true, trim: true })
  public title!: string;

  @prop({ required: true, trim: true })
  public description!: string;

  @prop()
  public image?: string;

  // A donde lleva el aviso: una coleccion, una categoria (el catalogo filtrado)
  // o, sin ninguna de las dos, los productos con descuento. Nunca las dos.
  @prop({ ref: () => Category })
  public category?: Ref<Category>;

  // No se llama `collection`: Mongoose reserva ese nombre en los documentos.
  @prop({ ref: () => Collection })
  public linkedCollection?: Ref<Collection>;

  // Solo con coleccion: mientras la promocion este vigente, sus productos
  // tienen este descuento (si es mayor que el propio del producto).
  @prop({ min: 1, max: 90 })
  public discountPercent?: number;

  // Fechas de calendario ("2026-11-30"), en horario de Argentina. Sin fechas,
  // la promocion vale mientras este activa.
  @prop()
  public startDate?: string;

  @prop()
  public endDate?: string;

  @prop({ required: true, default: true })
  public isActive!: boolean;
}

export const PromotionModel = getModelForClass(Promotion);
