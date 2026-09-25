# La autenticacion va en middlewares y la validacion en los controllers

La autenticacion y la autorizacion son middlewares de Express que se encadenan
en cada ruta (`authenticate`, `optionalAuthenticate`, `requireAdmin` en
`src/middleware/auth.ts`). El usuario autenticado queda en `req.user`. La
validacion no es un middleware: cada controller llama a
`validate(schema, req.body)` (`src/http/validate.ts`) y recibe el dato ya tipado.

Antes habia un wrapper `handler({ schema, auth }, fn)` que resolvia las dos
cosas y le pasaba al controller un contexto tipado. Funcionaba, pero escondia la
autenticacion: mirando las rutas no se veia que endpoint estaba protegido.
Con middlewares, la ruta dice quien puede usarla:

```ts
productRouter.post("/", authenticate, requireAdmin, createProduct);
```

La validacion se queda en el controller porque ahi el tipo sale solo del
schema de Zod. Como middleware, el controller tendria que declarar a mano el
tipo de `req.body` y confiar en que el middleware se monto. Ademas, en Express 5
`req.query` no se puede reasignar, asi que un middleware no podria dejar el
query ya convertido.

## Consequences

- TypeScript no puede verificar que una ruta tenga `authenticate`. `req.user`
  es opcional, y los controllers que lo necesitan usan `getAuthenticatedUser`,
  que responde 401 si falta en vez de romper.
- `requireAdmin` asume que `authenticate` corrio antes. Sin el, responde 403
  porque no hay usuario, que es seguro pero el mensaje no es el ideal.
- No hace falta envolver los controllers `async` en try/catch: Express 5 pasa al
  error handler cualquier promesa rechazada.
