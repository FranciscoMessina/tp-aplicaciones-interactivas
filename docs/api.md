# API REST

Referencia de la API del backend (`backend/`). Todas las rutas empiezan con
`/api`. La colección de [Bruno](https://www.usebruno.com/) en
`backend/bruno` tiene un ejemplo de cada request.

## Productos

La colección de productos está disponible en `/api/products`. Cada publicación
tiene `name`, `category`, `description`, `images` (array de URLs), `price`,
`availableQuantity` (estado de disponibilidad: con `0` se muestra sin stock),
`isActive` (si está publicada) e `isFeatured` (si se destaca en el inicio). La consigna deja
el precio como opcional según el rubro; en el nuestro es obligatorio. Crear,
modificar y eliminar publicaciones requiere estar autenticado con un usuario de
rol `admin`.
Activar o desactivar una publicacion es una modificacion mas: se hace enviando
`isActive` a `PATCH /api/products/:id`, no hay un endpoint aparte.

- `GET /api/products`: obtiene la lista de productos activos. No requiere
  autenticación. Acepta `search` (full-text sobre `name` y `description`),
  `category`, `minPrice`, `maxPrice`, `isFeatured`, `inStock` (`true`: con
  unidades; `false`: sin stock), `sortBy` (`publicationDate`, `price`, `name` o
  `relevance`), `sortOrder` (`asc` o `desc`), `page` (desde 1), `pageSize` (1 a
  100, por defecto 20) e `includeInactive`. El catálogo público y el panel piden
  solo la página que muestran. El
  orden por defecto es fecha de publicación descendente y `relevance` requiere
  `search`. Responde una página:
  `{ "items": [...], "page": 1, "pageSize": 20, "total": 97 }`.
  Un administrador autenticado que envie `includeInactive=true` recibe tambien
  las publicaciones desactivadas; para cualquier otro visitante el parametro
  se ignora en silencio, porque el endpoint es publico y un 403 delataria que
  el flag significa algo.
- `GET /api/products/:id`: obtiene un producto con su categoría. Un producto
  inactivo responde 404, salvo para un administrador autenticado.
- `POST /api/products`: crea un producto con `name`, `category`, `description`,
  `images`, `price` y, opcionales, `availableQuantity` (por defecto `0`),
  `isActive` (por defecto `true`) e `isFeatured` (por defecto `false`).
  Solo administradores.
- `PATCH /api/products/:id`: modifica cualquiera de los campos anteriores,
  `isActive` e `isFeatured` incluidos. Solo administradores.
- `DELETE /api/products/:id`: elimina una publicación. Solo administradores.

Las publicaciones inactivas no se devuelven desde el listado público. Cada
publicación debe incluir al menos una imagen con una URL válida y su categoría
debe ser el ID de una categoría existente.

### Imágenes

- `POST /api/images`: sube una imagen (`multipart/form-data`, campo `image`;
  JPG, PNG, WEBP o GIF de hasta 5 MB) y devuelve su URL pública en `data.url`,
  lista para agregar al array `images` de un producto. Además del tipo que
  declara el navegador, se comparan los primeros bytes del archivo con la firma
  del formato: si no coinciden, se borra y responde `400`.
  Solo administradores.
  Los archivos quedan en `backend/public/uploads`.

## Categorías e información institucional

- `GET /api/categories/summary`: las categorías con productos publicados, de la
  más grande a la más chica, con `productCount`, `minPrice` y hasta cinco
  nombres de ejemplo en `examples`. Es lo que muestra la tabla del inicio.
- `GET /api/categories`: lista categorías ordenadas por nombre. Los nombres son
  únicos sin distinguir mayúsculas: "Consolas" y "consolas" chocan con un 409.
- `POST`, `PATCH /:id` y `DELETE /:id` sobre `/api/categories`: solo administradores.
- `GET /api/business-info`: obtiene la información pública del comercio.
- `PUT /api/business-info`: crea o actualiza la información institucional. Solo administradores.

## Consultas

- `POST /api/enquiries`: permite a cualquier visitante enviar una consulta.
- `GET /api/enquiries`: lista las consultas de la más nueva a la más vieja, de a
  páginas: acepta `status` (`PENDING`, `READ` o `RESOLVED`) para filtrar, `page`
  (desde 1) y `pageSize` (1 a 50, por defecto 20). Responde
  `{ "items": [...], "page": 1, "pageSize": 20, "total": 4 }`, igual que el
  listado de productos. Cada consulta incluye `replies` (`id`, `message`,
  `authorName`, `createdAt`).
- `POST /api/enquiries/:id/replies` (con `message`, hasta 5000 caracteres): le
  envía la respuesta por mail al visitante, con el mail de quien responde como
  `Reply-To`, la guarda en la consulta y la deja en `RESOLVED`. Primero se
  envía: si el servidor de correo falla responde `500` y no guarda nada.
  Devuelve la consulta actualizada con `201`.
- `PATCH /api/enquiries/:id` (con `status`) y `DELETE /api/enquiries/:id`.

Todas salvo `POST` son solo para administradores. Al recibir una consulta se
avisa por mail a los administradores y se le confirma la recepción al
visitante (ver "Correos").

El estado de una consulta comienza en `PENDING`. Puede pasar a `READ` o
`RESOLVED`, y desde cualquier estado puede volver a `PENDING`. Lo único que no
se permite es pasar de `RESOLVED` a `READ`. Los cambios al mismo estado son
idempotentes. El cambio se aplica en una sola operación condicionada al estado
anterior: si dos administradores cambian la misma consulta a la vez, el segundo
recibe `409` en lugar de pisar al primero.

## Métricas

- `GET /api/stats`: datos del dashboard del panel. Solo administradores.
  Devuelve `products` (`total`, `active`, `outOfStock`, `featured`),
  `enquiries` (cantidad por estado y `total`) y `productsByCategory`
  (`name` y `count` de cada categoría, de mayor a menor).

## Usuarios y autenticación

Las únicas cuentas son las de los administradores del comercio: los visitantes
navegan y envían consultas sin registrarse. No hay registro público: un
administrador da de alta a los demás desde el panel.

- `GET /api/users`: lista los administradores. Solo administradores.
- `POST /api/users`: crea un administrador con `fullName`, `email` y `phone`. La cuenta nace sin contraseña y la persona recibe un mail con el enlace `FRONTEND_URL/restablecer-contrasena?token=...&invitacion=1` para elegirla; vence a las 72 horas. Solo administradores.
- `DELETE /api/users/:id`: elimina un administrador; sus sesiones dejan de valer en el acto. Nadie puede eliminar su propia cuenta (`409`), así que siempre queda al menos uno. Solo administradores.
- `POST /api/users/login`: inicia sesión con `email` y `password` y devuelve un JWT (incluye el rol del usuario).
- `POST /api/users/logout`: valida el JWT y responde sin contenido; el cliente debe eliminar el token almacenado.
- `GET /api/users/me`: obtiene los datos del usuario autenticado.
- `PATCH /api/users/me`: modifica `fullName`, `email` y/o `phone` del usuario autenticado.
- `PATCH /api/users/me/password`: cambia la contraseña con `currentPassword` y `newPassword`. Cierra las demás sesiones, anula los enlaces de recuperación pendientes y devuelve un `accessToken` nuevo para seguir en la sesión actual.
- `POST /api/users/forgot-password`: genera un token de recuperación y le manda al usuario un mail con el enlace `FRONTEND_URL/restablecer-contrasena?token=...`. La respuesta es la misma exista o no la cuenta.
- `POST /api/users/reset-password`: cambia la contraseña con `token` y `password`, y cierra las sesiones abiertas. También activa las cuentas invitadas.

Los correos se normalizan a minúsculas y tienen un índice único en MongoDB. Las
contraseñas se almacenan con bcrypt y los tokens de recuperación son de un solo
uso, se guardan hasheados y vencen a los 15 minutos. Las contraseñas nuevas
tienen entre 8 caracteres y 72 bytes: bcrypt ignora lo que sigue, y una letra
con tilde ocupa 2 bytes.

Login, recuperación, restablecimiento y el envío de consultas tienen un límite
por IP (`src/middleware/rate-limit.ts`): 10 logins fallidos, 5 pedidos de
recuperación o 10 restablecimientos cada 15 minutos, y 5 consultas por hora.
Al superarlo la API responde `429`. Si la API se publica detrás de un proxy hay
que definir `TRUST_PROXY` (ver el README) para que cuente la IP real.

## Correos

`src/services/mail.service.ts` envía los mails con nodemailer por SMTP
(variables `SMTP_*`, ver el README). En desarrollo, si `SMTP_HOST` no está
configurado, el mail completo se escribe en la consola del servidor, así el
proyecto funciona sin una cuenta de correo. Con `NODE_ENV=production` el
servidor no arranca sin SMTP: la consola dejaría enlaces de recuperación y datos
de los visitantes en los logs. Un mail que no se puede enviar se registra como error
pero no hace fallar la operación que lo disparó.

## Respuestas

Todas las respuestas tienen la misma forma. Si la operación salió bien:

```json
{ "success": true, "data": { "id": "...", "name": "..." } }
```

Si falló:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Hay campos con errores",
    "fields": {
      "email": ["El email no es válido"],
      "images.0": ["La URL no es válida"]
    }
  }
}
```

`code` es uno de `INVALID_INPUT` (400), `UNAUTHENTICATED` (401), `FORBIDDEN`
(403), `NOT_FOUND` (404), `CONFLICT` (409), `TOO_MANY_REQUESTS` (429) o
`UNEXPECTED` (500). `fields` solo
aparece cuando el error se puede asociar a campos concretos: la clave es el
nombre del campo (o su ruta, como `images.0`) y el valor la lista de mensajes.
Así el front puede mostrar cada error debajo de su input. Un email ya
registrado, por ejemplo, responde `409` con `fields.email`.

Las eliminaciones y el cierre de sesión responden `204` sin cuerpo.

Los documentos se serializan con una transformacion `toJSON` compartida por
todos los modelos: exponen `id` en lugar de `_id` y no incluyen `__v`. Aplica
tambien a los documentos anidados, por ejemplo la `category` que acompania a
cada producto en el listado.

## Validación

El body, los parámetros de la URL y el query string se validan con Zod al
principio de cada controller, con `validate(schema, req.body)`. Cuando son
inválidos, la API responde `400` con los errores por campo en `error.fields`.

## Autenticación en el código

Las rutas protegidas encadenan los middlewares de `src/middleware/auth.ts`
antes del controller:

```ts
productRouter.post("/", authenticate, requireAdmin, createProduct);
```

- `authenticate`: exige el header `Authorization: Bearer <token>` y deja el
  usuario en `req.user`. Además de la firma y el vencimiento, comprueba en la
  base que la cuenta exista y que el token sea de la sesión vigente: cada
  usuario tiene un `sessionVersion` que viaja en el token y aumenta al cambiar
  la contraseña.
- `optionalAuthenticate`: igual, pero si no hay token sigue como visitante.
- `requireAdmin`: solo deja pasar usuarios con rol `admin`.

La API habilita CORS para que el front, que corre en otro origen, pueda
consumirla desde el navegador.
