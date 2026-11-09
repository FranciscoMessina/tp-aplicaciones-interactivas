import {
  getModelForClass,
  index,
  modelOptions,
  prop,
  type Ref,
} from "@typegoose/typegoose";
import { Product } from "./product.model.ts";
import { baseModelOptions } from "./model-options.ts";

/**
 * Cuantas veces se vio la ficha de un producto en un dia. Un contador por dia
 * en vez de un documento por visita: alcanza para las metricas del panel y la
 * coleccion crece a lo sumo un documento por producto por dia.
 */
@index({ product: 1, day: 1 }, { unique: true })
@index({ day: 1 })
@modelOptions(baseModelOptions)
export class ProductView {
  @prop({ ref: () => Product, required: true })
  public product!: Ref<Product>;

  // Fecha de calendario en horario de Argentina ("2026-11-09").
  @prop({ required: true })
  public day!: string;

  @prop({ required: true, min: 0, default: 0 })
  public count!: number;
}

export const ProductViewModel = getModelForClass(ProductView);
