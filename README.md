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
- `npm run lint`: analiza el código con ESLint.
- `npm run lint:fix`: corrige automáticamente los problemas de lint que sea posible resolver.
- `npm run format`: formatea el proyecto con Prettier.
- `npm run format:check`: verifica el formato sin modificar archivos.

## API

La colección de productos está disponible en `/api/products`. Cada publicación
tiene `name`, `category`, `description`, `images` (array de URLs), `price`
(opcional) e `isActive` (estado de disponibilidad). Crear, modificar y eliminar
publicaciones requiere estar autenticado con un usuario de rol `admin`.
Activar o desactivar una publicacion es una modificacion mas: se hace enviando
`isActive` a `PATCH /api/products/:id`, no hay un endpoint aparte.

- `GET /api/products`: obtiene la lista de productos activos. No requiere
  autenticación. Acepta `search`, `category` e `includeInactive`. Un
  administrador autenticado que envie `includeInactive=true` recibe tambien las
  publicaciones desactivadas; para cualquier otro visitante el parametro se
  ignora en silencio, porque el endpoint es publico y un 403 delataria que el
  flag significa algo.
- `POST /api/products`: crea un producto con `name`, `category`, `description`,
  `images`, `price` (opcional) e `isActive` (opcional, por defecto `true`). Solo
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

- `POST /api/contact-form`: permite a cualquier visitante enviar una consulta.
- `GET /api/contact-form`, `PATCH /api/contact-form/:id` y `DELETE /api/contact-form/:id`:
  solo administradores.

El estado de una consulta comienza en `PENDING`. Puede avanzar a `READ` o
`RESOLVED`, y desde `READ` sólo puede avanzar a `RESOLVED`; los cambios al mismo
estado son idempotentes.

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

Los documentos se serializan con una transformacion `toJSON` compartida por
todos los modelos: exponen `id` en lugar de `_id` y no incluyen `__v`. Aplica
tambien a los documentos anidados, por ejemplo la `category` que acompania a
cada producto en el listado.

## Validación

Los cuerpos de las solicitudes se validan con Zod. Cuando son inválidos, la API
responde `400` con el campo y el motivo de cada error.
