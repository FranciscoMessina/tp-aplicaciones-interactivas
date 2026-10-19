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
  `category`, `minPrice`, `maxPrice`, `sortBy`
  (`publicationDate`, `price` o `relevance`), `sortOrder` (`asc` o `desc`),
  `page` (desde 1), `pageSize` (1 a 100, por defecto 20) e `includeInactive`. El
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
  lista para agregar al array `images` de un producto. Solo administradores.
  Los archivos quedan en `backend/public/uploads`.

## Categorías e información institucional

- `GET /api/categories`: lista categorías ordenadas por nombre. Los nombres son
  únicos sin distinguir mayúsculas: "Consolas" y "consolas" chocan con un 409.
- `POST`, `PATCH /:id` y `DELETE /:id` sobre `/api/categories`: solo administradores.
- `GET /api/business-info`: obtiene la información pública del comercio.
- `PUT /api/business-info`: crea o actualiza la información institucional. Solo administradores.

## Consultas

- `POST /api/enquiries`: permite a cualquier visitante enviar una consulta.
- `GET /api/enquiries`: lista las consultas de la más nueva a la más vieja.
  Acepta `status` (`PENDING`, `READ` o `RESOLVED`) para filtrar.
- `PATCH /api/enquiries/:id` (con `status`) y `DELETE /api/enquiries/:id`.

Todas salvo `POST` son solo para administradores. Al recibir una consulta se
avisa por mail a los administradores y se le confirma la recepción al
visitante (ver "Correos").

El estado de una consulta comienza en `PENDING`. Puede pasar a `READ` o
`RESOLVED`, y desde cualquier estado puede volver a `PENDING`. Lo único que no
se permite es pasar de `RESOLVED` a `READ`. Los cambios al mismo estado son
idempotentes.

## Métricas

- `GET /api/stats`: datos del dashboard del panel. Solo administradores.
  Devuelve `products` (`total`, `active`, `outOfStock`, `featured`),
  `enquiries` (cantidad por estado y `total`) y `productsByCategory`
  (`name` y `count` de cada categoría, de mayor a menor).

## Usuarios y autenticación

Las únicas cuentas son las de los administradores del comercio: los visitantes
navegan y envían consultas sin registrarse.

- `POST /api/users/register`: registra un administrador con `fullName`, `email`, `phone` y `password` (mínimo 8 caracteres). Devuelve el JWT y el usuario, como el login.
- `POST /api/users/login`: inicia sesión con `email` y `password` y devuelve un JWT (incluye el rol del usuario).
- `POST /api/users/logout`: valida el JWT y responde sin contenido; el cliente debe eliminar el token almacenado.
- `GET /api/users/me`: obtiene los datos del usuario autenticado.
- `PATCH /api/users/me`: modifica `fullName`, `email` y/o `phone` del usuario autenticado.
- `PATCH /api/users/me/password`: cambia la contraseña con `currentPassword` y `newPassword`.
- `POST /api/users/forgot-password`: genera un token de recuperación y le manda al usuario un mail con el enlace `FRONTEND_URL/restablecer-contrasena?token=...`. La respuesta es la misma exista o no la cuenta.
- `POST /api/users/reset-password`: cambia la contraseña con `token` y `password`.

Los correos se normalizan a minúsculas y tienen un índice único en MongoDB. Las
contraseñas se almacenan con bcrypt y los tokens de recuperación son de un solo
uso, se guardan hasheados y vencen a los 15 minutos.

## Correos

`src/services/mail.service.ts` envía los mails con nodemailer por SMTP
(variables `SMTP_*`, ver el README). Si `SMTP_HOST` no está configurado, el
mail completo se escribe en la consola del servidor, así el proyecto funciona
sin una cuenta de correo. Un mail que no se puede enviar se registra como error
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
(403), `NOT_FOUND` (404), `CONFLICT` (409) o `UNEXPECTED` (500). `fields` solo
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
  usuario en `req.user`.
- `optionalAuthenticate`: igual, pero si no hay token sigue como visitante.
- `requireAdmin`: solo deja pasar usuarios con rol `admin`.

La API habilita CORS para que el front, que corre en otro origen, pueda
consumirla desde el navegador.
