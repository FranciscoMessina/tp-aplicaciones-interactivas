import type { IModelOptions } from "@typegoose/typegoose/lib/types.js";

/**
 * Opciones compartidas por todos los modelos. La respuesta la decide esta
 * transformacion y no el documento de Mongoose: sin esto cada `res.json` de un
 * documento publica `_id`, `__v` y cualquier `@prop` que se agregue despues.
 *
 * `virtuals: true` habilita el virtual `id` que Mongoose ya define, asi que
 * alcanza con borrar los campos internos.
 */
export const baseModelOptions: IModelOptions = {
  schemaOptions: {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_document, record: Record<string, unknown>) {
        delete record._id;
        delete record.__v;
        return record;
      },
    },
  },
};
