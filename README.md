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
