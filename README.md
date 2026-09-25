# Proyecto de Aplicaciones Interactivas

Por ahora solo el backend, despues se sumara el front.

API REST desarrollada con Node.js, Express, TypeScript, MongoDB, Mongoose y Typegoose.

## Requisitos

- Node.js 24
- npm 11
- Una instancia de MongoDB

## Configuración

1. Instalar las dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` como `.env` y completar las variables requeridas:

   ```dotenv
   MONGODB_URI=mongodb://localhost:27017/products
   PORT=8080
   JWT_SECRET=un-secreto-aleatorio-de-al-menos-32-caracteres
   JWT_EXPIRATION_SECONDS=3600
   ```

3. Iniciar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

## Scripts disponibles

- `npm run dev`: compila ante cada cambio y reinicia el servidor.
- `npm run typecheck`: verifica los tipos de TypeScript sin generar archivos.
- `npm run build`: limpia y compila el proyecto en `dist`.
- `npm start`: ejecuta la aplicación compilada.
- `npm run seed`: elimina usuarios, categorías y productos existentes, crea los
  datos de demostración y crea el índice de MongoDB Search si todavía no existe.
- `npm run lint`: analiza el código con ESLint.
- `npm run lint:fix`: corrige automáticamente los problemas de lint que sea posible resolver.
- `npm run format`: formatea el proyecto con Prettier.
- `npm run format:check`: verifica el formato sin modificar archivos.

## Datos de demostración

Con la conexión a MongoDB Atlas y las variables de entorno configuradas, ejecutar:

```bash
npm run seed
```

El seed elimina todos los productos, categorías y usuarios existentes antes de
crear 108 productos de tecnología en 11 categorías (consolas, computadoras,
celulares, videojuegos, etc.), un administrador y un cliente. El catálogo está
en `src/scripts/seed-catalog.ts`. No elimina la
información institucional ni las consultas recibidas. También comprueba si el
índice de MongoDB Search `productSearch` ya existe antes de crearlo.

Las cuentas creadas son `admin@example.com` y `cliente@example.com`. Sus
contraseñas se configuran mediante `SEED_ADMIN_PASSWORD` y
`SEED_CUSTOMER_PASSWORD`; los valores de demostración están en `.env.example`.

## API

La colección de productos está disponible en `/api/products`. Cada publicación
tiene `name`, `category`, `description`, `images` (array de URLs), `price` e
`isActive` (estado de disponibilidad). La consigna deja el precio como opcional
según el rubro; en el nuestro es obligatorio. Crear, modificar y eliminar
publicaciones requiere estar autenticado con un usuario de rol `admin`.
Activar o desactivar una publicacion es una modificacion mas: se hace enviando
`isActive` a `PATCH /api/products/:id`, no hay un endpoint aparte.

- `GET /api/products`: obtiene la lista de productos activos. No requiere
  autenticación. Acepta `search` (full-text sobre `name` y `description`),
  `category`, `minPrice`, `maxPrice`, `sortBy` (`publicationDate`, `price` o
  `relevance`), `sortOrder` (`asc` o `desc`) e `includeInactive`. El orden por
  defecto es fecha de publicación descendente y `relevance` requiere `search`.
  Un administrador autenticado que envie `includeInactive=true` recibe tambien
  las publicaciones desactivadas; para cualquier otro visitante el parametro
  se ignora en silencio, porque el endpoint es publico y un 403 delataria que
  el flag significa algo.
- `POST /api/products`: crea un producto con `name`, `category`, `description`,
  `images`, `price` e `isActive` (opcional, por defecto `true`). Solo
  administradores.
- `PATCH /api/products/:id`: modifica cualquiera de los campos anteriores,
  `isActive` incluido. Solo administradores.
- `DELETE /api/products/:id`: elimina una publicación. Solo administradores.

Las publicaciones inactivas no se devuelven desde el listado público. Cada
publicación debe incluir al menos una imagen con una URL válida y su categoría
debe ser el ID de una categoría existente.

### Categorías e información institucional

- `GET /api/categories`: lista categorías.
- `POST`, `PATCH /:id` y `DELETE /:id` sobre `/api/categories`: solo administradores.
- `GET /api/business-info`: obtiene la información pública del comercio.
- `PUT /api/business-info`: crea o actualiza la información institucional. Solo administradores.

### Consultas

- `POST /api/enquiries`: permite a cualquier visitante enviar una consulta.
- `GET /api/enquiries`, `PATCH /api/enquiries/:id` y `DELETE /api/enquiries/:id`:
  solo administradores.

El estado de una consulta comienza en `PENDING`. Puede pasar a `READ` o
`RESOLVED`, y desde cualquier estado puede volver a `PENDING`. Lo único que no
se permite es pasar de `RESOLVED` a `READ`. Los cambios al mismo estado son
idempotentes.

### Usuarios y autenticación

- `POST /api/users/register`: registra un usuario con `fullName`, `email`, `phone` y `password` (mínimo 8 caracteres). El rol se asigna siempre como `customer`; un rol `admin` debe otorgarse manualmente en la base de datos.
- `POST /api/users/login`: inicia sesión con `email` y `password` y devuelve un JWT (incluye el rol del usuario).
- `POST /api/users/logout`: valida el JWT y responde sin contenido; el cliente debe eliminar el token almacenado.
- `GET /api/users/me`: obtiene los datos del usuario autenticado.
- `PATCH /api/users/me`: modifica `fullName`, `email` y/o `phone` del usuario autenticado.
- `POST /api/users/forgot-password`: genera un token de recuperación. Fuera de producción, lo incluye en la respuesta para facilitar el desarrollo; en producción debe enviarse por email.
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
    "message": "Some fields are invalid",
    "fields": {
      "email": ["Invalid email address"],
      "images.0": ["Invalid URL"]
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
