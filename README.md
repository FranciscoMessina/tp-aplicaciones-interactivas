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

La colección de productos está disponible en `/api/products`:

- `GET /api/products`: obtiene la lista de productos.
- `POST /api/products`: crea un producto utilizando `name`, `description` y `quantity`.

### Usuarios y autenticación

- `POST /api/users/register`: registra un usuario con `fullName`, `email`, `phone` y `password` (mínimo 8 caracteres).
- `POST /api/users/login`: inicia sesión con `email` y `password` y devuelve un JWT.
- `POST /api/users/logout`: valida el JWT y responde sin contenido; el cliente debe eliminar el token almacenado.
- `GET /api/users/me`: obtiene los datos del usuario autenticado.
- `PATCH /api/users/me`: modifica `fullName`, `email` y/o `phone` del usuario autenticado.
- `POST /api/users/forgot-password`: genera un token de recuperación. Fuera de producción, lo incluye en la respuesta para facilitar el desarrollo; en producción debe enviarse por email.
- `POST /api/users/reset-password`: cambia la contraseña con `token` y `password`.

Los correos se normalizan a minúsculas y tienen un índice único en MongoDB. Las
contraseñas se almacenan con bcrypt y los tokens de recuperación son de un solo
uso, se guardan hasheados y vencen a los 15 minutos.
