import type { ZodType, z } from "zod";
import {
  ApplicationError,
  ApplicationErrorKind,
  type FieldErrors,
} from "../domain/application-error.ts";

/**
 * Valida `value` contra un schema de Zod y devuelve el dato ya limpio y tipado
 * (con los espacios recortados, los numeros convertidos, los defaults puestos).
 * Si no es valido tira un `ApplicationError` con los errores agrupados por
 * campo, que el error handler convierte en un 400.
 *
 * Se usa al principio de cada controller:
 *
 *   const body = validate(createProductSchema, req.body);
 *
 * `body` queda con el tipo que describe el schema, sin tener que declararlo a mano.
 */
export function validate<TSchema extends ZodType>(
  schema: TSchema,
  value: unknown,
): z.output<TSchema> {
  const result = schema.safeParse(value);

  if (result.success) {
    return result.data;
  }

  const fields: FieldErrors = {};
  // Errores que no son de un campo puntual, por ejemplo "Provide at least one
  // field" cuando se manda un PATCH vacio.
  const generalErrors: string[] = [];

  for (const issue of result.error.issues) {
    if (issue.path.length === 0) {
      generalErrors.push(issue.message);
      continue;
    }

    const field = issue.path.map(String).join(".");
    (fields[field] ??= []).push(issue.message);
  }

  throw new ApplicationError(
    ApplicationErrorKind.InvalidInput,
    generalErrors.join(". ") || "Some fields are invalid",
    fields,
  );
}
