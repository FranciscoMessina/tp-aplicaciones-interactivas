# Proyecto de Aplicaciones Interactivas

Por ahora solo el backend, despues se sumara el front.

API REST desarrollada con Node.js, Express, TypeScript, MongoDB, Mongoose y Typegoose.

## Requisitos

- Node.js 24
- npm 11
- Un cluster de MongoDB Atlas (sirve el gratuito). La búsqueda de productos usa
  Atlas Search (`$search`), que no existe en un MongoDB local común: sin Atlas
  el resto de la API funciona, pero `GET /api/products?search=...` responde 500.

## Configuración

1. Instalar las dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` como `.env` y completar las variables requeridas:

   ```dotenv
   MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/comercio
   PORT=8080
   JWT_SECRET=un-secreto-aleatorio-de-al-menos-32-caracteres
   JWT_EXPIRATION_SECONDS=3600
   ```

3. Cargar los datos de demostración (ver abajo):

   ```bash
   npm run seed
   ```

4. Iniciar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

## Scripts disponibles

- `npm run dev`: compila ante cada cambio y reinicia el servidor.
- `npm run typecheck`: verifica los tipos de TypeScript sin generar archivos.
- `npm run build`: limpia y compila el proyecto en `dist`.
- `npm start`: ejecuta la aplicación compilada.
- `npm run seed`: borra todos los datos, crea los de demostración y crea o
  actualiza el índice de Atlas Search.
- `npm run lint`: analiza el código con ESLint.
- `npm run lint:fix`: corrige automáticamente los problemas de lint que sea posible resolver.
- `npm run format`: formatea el proyecto con Prettier.
- `npm run format:check`: verifica el formato sin modificar archivos.

## Datos de demostración

Con la conexión a MongoDB Atlas y las variables de entorno configuradas, ejecutar:

```bash
npm run seed
```

El seed borra productos, categorías, usuarios, consultas e información
institucional, y después crea:

- 108 productos de tecnología en 11 categorías (consolas, computadoras,
  celulares, videojuegos, etc.), con algunos inactivos y sin stock.
  El catálogo está en `src/scripts/seed-catalog.ts`.
- La información institucional del comercio.
- Cuatro consultas en distintos estados.
- Un administrador y un cliente.

También crea el índice de Atlas Search `productSearch`, o lo actualiza si ya
existe: Atlas no toma solo los cambios de la definición del modelo. Después de
crearlo o actualizarlo, Atlas tarda un rato en indexar; mientras tanto la
búsqueda puede devolver menos resultados.

Las cuentas creadas son `admin@example.com` y `cliente@example.com`. Sus
contraseñas se configuran mediante `SEED_ADMIN_PASSWORD` y
`SEED_CUSTOMER_PASSWORD`; los valores de demostración están en `.env.example`.
Nadie puede registrarse como administrador: el del seed es el primero, y los
demás los crea un administrador con `POST /api/users/admins`.

El modelo de datos está en [docs/modelo-de-datos.md](docs/modelo-de-datos.md) y
la descripción funcional en
[docs/descripcion-funcional.md](docs/descripcion-funcional.md).

## API

La colección de productos está disponible en `/api/products`. Cada publicación
tiene `name`, `category`, `description`, `images` (array de URLs), `price`,
`availableQuantity` (estado de disponibilidad: con `0` se muestra sin stock) e
`isActive` (si está publicada). La consigna deja
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
  `images`, `price` y, opcionales, `availableQuantity` (por defecto `0`) e
  `isActive` (por defecto `true`). Solo administradores.
- `PATCH /api/products/:id`: modifica cualquiera de los campos anteriores,
  `isActive` incluido. Solo administradores.
- `DELETE /api/products/:id`: elimina una publicación. Solo administradores.

Las publicaciones inactivas no se devuelven desde el listado público. Cada
publicación debe incluir al menos una imagen con una URL válida y su categoría
debe ser el ID de una categoría existente.

### Categorías e información institucional

- `GET /api/categories`: lista categorías ordenadas por nombre. Los nombres son
  únicos sin distinguir mayúsculas: "Consolas" y "consolas" chocan con un 409.
- `POST`, `PATCH /:id` y `DELETE /:id` sobre `/api/categories`: solo administradores.
- `GET /api/business-info`: obtiene la información pública del comercio.
- `PUT /api/business-info`: crea o actualiza la información institucional. Solo administradores.

### Consultas

- `POST /api/enquiries`: permite a cualquier visitante enviar una consulta.
- `GET /api/enquiries`: lista las consultas de la más nueva a la más vieja.
  Acepta `status` (`PENDING`, `READ` o `RESOLVED`) para filtrar.
- `PATCH /api/enquiries/:id` (con `status`) y `DELETE /api/enquiries/:id`.

Todas salvo `POST` son solo para administradores.

El estado de una consulta comienza en `PENDING`. Puede pasar a `READ` o
`RESOLVED`, y desde cualquier estado puede volver a `PENDING`. Lo único que no
se permite es pasar de `RESOLVED` a `READ`. Los cambios al mismo estado son
idempotentes.

### Usuarios y autenticación

- `POST /api/users/register`: registra un usuario con `fullName`, `email`, `phone` y `password` (mínimo 8 caracteres). El rol se asigna siempre como `customer`.
- `POST /api/users/admins`: crea un administrador con los mismos campos que el registro. Solo administradores. Devuelve el usuario creado, sin token.
- `POST /api/users/login`: inicia sesión con `email` y `password` y devuelve un JWT (incluye el rol del usuario).
- `POST /api/users/logout`: valida el JWT y responde sin contenido; el cliente debe eliminar el token almacenado.
- `GET /api/users/me`: obtiene los datos del usuario autenticado.
- `PATCH /api/users/me`: modifica `fullName`, `email` y/o `phone` del usuario autenticado.
- `PATCH /api/users/me/password`: cambia la contraseña con `currentPassword` y `newPassword`.
- `POST /api/users/forgot-password`: genera un token de recuperación y se lo envía al usuario. Todavía no hay envío de mails: el token se escribe en la consola del servidor (`src/services/mail.service.ts`). La respuesta es la misma exista o no la cuenta.
- `POST /api/users/reset-password`: cambia la contraseña con `token` y `password`.

Los correos se normalizan a minúsculas y tienen un índice único en MongoDB. Las
contraseñas se almacenan con bcrypt y los tokens de recuperación son de un solo
uso, se guardan hasheados y vencen a los 15 minutos.

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
