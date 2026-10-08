import { z, type ZodType } from "zod";
import {
  ApplicationError,
  ApplicationErrorKind,
  type FieldErrors,
} from "../domain/application-error.ts";

// Mensajes de error de Zod en español. Es una configuracion global de Zod, y se
// hace aca porque todas las validaciones de requests pasan por `validate`.
//
// La traduccion que trae Zod (`locales.es`) cubre todos los casos pero con
// frases genericas ("Inválido URL"). Para los errores que el usuario ve en los
// formularios escribimos mensajes propios; si `customError` devuelve
// `undefined`, Zod usa su traduccion.
z.config(z.locales.es());
z.config({
  customError: (issue) => {
    switch (issue.code) {
      case "invalid_type":
        return issue.input === undefined
          ? "Este campo es obligatorio"
          : undefined;
      case "too_small":
        if (issue.origin === "string") {
          return Number(issue.minimum) <= 1
            ? "Este campo es obligatorio"
            : `Debe tener al menos ${issue.minimum} caracteres`;
        }
        if (issue.origin === "array") {
          return `Debe tener al menos ${issue.minimum} elemento(s)`;
        }
        if (issue.origin === "number") {
          return `Debe ser mayor o igual a ${issue.minimum}`;
        }
        return undefined;
      case "invalid_format":
        if (issue.format === "email") {
          return "El email no es válido";
        }
        if (issue.format === "url") {
          return "La URL no es válida";
        }
        return undefined;
      default:
        return undefined;
    }
  },
});

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
    generalErrors.join(". ") || "Hay campos con errores",
    fields,
  );
}
