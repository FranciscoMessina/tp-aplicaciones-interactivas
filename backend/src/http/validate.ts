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
// frases genericas ("Inválido URL") o con nombres tecnicos ("se esperaba int").
// Por eso escribimos mensajes propios para todo lo que pueden producir nuestros
// schemas; la traduccion de Zod queda solo de respaldo, para los casos que
// `customError` no contempla (devuelve `undefined`).
z.config(z.locales.es());

// Para cuando llega un valor de otro tipo, por ejemplo un numero en un texto.
const invalidTypeMessages: Record<string, string> = {
  string: "Debe ser un texto",
  number: "Debe ser un número",
  int: "Debe ser un número entero",
  boolean: "Debe ser verdadero o falso",
  array: "Debe ser una lista",
  // Ningun schema tiene objetos anidados: esto solo pasa con el cuerpo entero.
  object: "Los datos tienen que enviarse como un objeto JSON",
};

z.config({
  customError: (issue) => {
    switch (issue.code) {
      case "invalid_type":
        // Va antes que "obligatorio": un request sin cuerpo tambien llega aca.
        if (issue.expected === "object") {
          return invalidTypeMessages.object;
        }
        return issue.input === undefined
          ? "Este campo es obligatorio"
          : invalidTypeMessages[issue.expected];
      case "too_small":
        if (issue.origin === "string") {
          return Number(issue.minimum) <= 1
            ? "Este campo es obligatorio"
            : `Debe tener al menos ${issue.minimum} caracteres`;
        }
        if (issue.origin === "array") {
          return Number(issue.minimum) === 1
            ? "Debe tener al menos un elemento"
            : `Debe tener al menos ${issue.minimum} elementos`;
        }
        if (issue.origin === "number") {
          return `Debe ser mayor o igual a ${issue.minimum}`;
        }
        return undefined;
      case "too_big":
        if (issue.origin === "string") {
          return `No puede tener más de ${issue.maximum} caracteres`;
        }
        if (issue.origin === "array") {
          return `No puede tener más de ${issue.maximum} elementos`;
        }
        if (issue.origin === "number") {
          return `Debe ser menor o igual a ${issue.maximum}`;
        }
        return undefined;
      case "invalid_format":
        if (issue.format === "email") {
          return "El email no es válido";
        }
        if (issue.format === "url") {
          return "La URL no es válida";
        }
        if (issue.format === "date") {
          return "Debe ser una fecha con el formato AAAA-MM-DD";
        }
        return undefined;
      // Un valor fuera de la lista permitida: un `z.enum` (estado, orden) o un
      // `z.stringbool` del query string. No se listan las opciones porque son
      // los valores internos de la API.
      case "invalid_value":
        return "No es una opción válida";
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
  // Errores que no son de un campo puntual, por ejemplo "Enviá al menos un
  // campo para modificar" cuando se manda un PATCH vacio.
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
