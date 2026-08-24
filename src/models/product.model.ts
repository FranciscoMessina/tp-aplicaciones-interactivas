import { getModelForClass, modelOptions, prop } from "@typegoose/typegoose";

// Seguramente se pregunten, que demonios es esto?
// Bueno es una forma de definir los modelos de Mongoose con typescript,
// evita tener codigo extra y duplicado.
// En este primer decorator se configuran opciones del schema.
@modelOptions({ schemaOptions: { timestamps: true } })
export class Product {
  // En cada prop decorator se configura el campo del documento en si.
  @prop({ required: true, trim: true })
  public name!: string;

  @prop({ required: true, trim: true })
  public description!: string;

  @prop({ required: true, min: 0 })
  public stock!: number;
}

export const ProductModel = getModelForClass(Product);
