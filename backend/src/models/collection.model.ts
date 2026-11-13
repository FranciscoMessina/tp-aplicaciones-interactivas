import {
  getModelForClass,
  modelOptions,
  prop,
  type Ref,
} from "@typegoose/typegoose";
import { Product } from "./product.model.ts";
import { baseModelOptions } from "./model-options.ts";

/**
 * Una seleccion de productos armada a mano, como "Setup gamer" o "Regalos
 * para el Día del Padre". Los productos se muestran en el orden de la lista.
 */
@modelOptions(baseModelOptions)
export class Collection {
  @prop({ required: true, trim: true })
  public title!: string;

  @prop({ trim: true })
  public description?: string;

  @prop({ ref: () => Product, type: () => [Product], default: [] })
  public products!: Ref<Product>[];

  @prop({ required: true, default: true })
  public isActive!: boolean;
}

export const CollectionModel = getModelForClass(Collection);
