# La validacion y la autenticacion viven en un solo modulo, no en middlewares

`handler({ schema, auth }, fn)` en `src/http/handler.ts` parsea el request y
resuelve la autenticacion, y le pasa al handler un contexto ya tipado. No hay
middleware `authenticate` ni `requireAdmin`: `auth` es `"user" | "admin" |
"optional"` y viaja como dato del handler.

Antes cada handler repetia el mismo ritual de parseo y cada consumidor de
`req.auth` lo casteaba a `AuthenticatedRequest`. Los dos eran el mismo problema:
estado derivado del request que llega al handler sin que los tipos lo
acompañen. Con middlewares montados aparte, una ruta que pusiera `requireAdmin`
sin `authenticate` leia `undefined.role` en runtime y compilaba igual. Como
requisito del handler, esa combinacion no se puede escribir.

## Consequences

- Un lector que busque `authenticate` en `src/middleware/` no lo va a
  encontrar. El orden de las cosas esta en `handler.ts`, no en las rutas.
- `exactOptionalPropertyTypes` se saco de `tsconfig.json`. Era lo que obligaba
  al armado manual de objetos opcionales en los controllers, y con el parseo
  centralizado distinguia algo que ningun caller distinguia. El costo es que los
  tipos ya no separan "campo ausente" de "campo explicitamente `undefined`";
  Mongoose descarta `undefined` en `$set`, asi que el comportamiento no cambia,
  pero paso de ser una garantia del compilador a un supuesto.
