import {
  getModelForClass,
  modelOptions,
  prop,
  type Ref,
} from "@typegoose/typegoose";
import { Category } from "./category.model.ts";
import { baseModelOptions } from "./model-options.ts";

/**
 * Un aviso que se muestra en el inicio, como "2x1 en auriculares todo
 * noviembre". No cambia precios: los descuentos son de cada producto.
 */
@modelOptions(baseModelOptions)
export class Promotion {
  @prop({ required: true, trim: true })
  public title!: string;

  @prop({ required: true, trim: true })
  public description!: string;

  @prop()
  public image?: string;

  // Si tiene categoria, el aviso lleva al catalogo filtrado por ella; si no,
  // a los productos con descuento.
  @prop({ ref: () => Category })
  public category?: Ref<Category>;

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
