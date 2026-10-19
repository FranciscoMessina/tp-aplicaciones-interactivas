# TechStore: plataforma web para pequeños comercios

Trabajo Práctico Obligatorio de Aplicaciones Interactivas (2.º cuatrimestre 2026).
La consigna está en [TPO Segundo Cuatrimestre 2026.pdf](TPO%20Segundo%20Cuatrimestre%202026.pdf).

TechStore es una tienda de tecnología ficticia. La aplicación tiene:

- un **sitio público** donde cualquier visitante, sin registrarse, conoce el
  comercio, recorre el catálogo, busca y filtra productos y envía consultas;
- un **área privada** donde los administradores del comercio gestionan
  productos, categorías, consultas, la información institucional y su perfil.

Las únicas cuentas del sistema son las de los administradores: no existen
cuentas de clientes.

## Documentación

| Documento | Contenido |
| --- | --- |
| [Descripción funcional](docs/descripcion-funcional.md) | Roles, funcionalidades y cómo se cumple cada punto de la consigna |
| [Modelo de datos](docs/modelo-de-datos.md) | Colecciones, campos, relaciones e índices |
| [Diagrama de navegación](docs/diagrama-de-navegacion.md) | Pantallas del frontend y cómo se llega a cada una |
| [API REST](docs/api.md) | Endpoints, formato de respuestas, validación y autenticación |
| Manual de instalación | Este archivo, más abajo |
| Script de creación de la base | `backend/src/scripts/seed.ts` (`npm run seed`), ver [Base de datos](#base-de-datos) |

## Tecnologías

- **Frontend** (`frontend/`): React 19, React Router 7, TypeScript, CSS propio y Vite.
- **Backend** (`backend/`): Node.js 24, Express 5, TypeScript, Zod para validar,
  JWT para la autenticación y nodemailer para los correos.
- **Base de datos**: MongoDB Atlas con Mongoose y Typegoose. La búsqueda de
  texto usa Atlas Search.

El frontend y el backend son proyectos separados que se comunican solo por la
API REST. El backend está organizado en capas: rutas → middlewares →
controllers → services → modelos.

```text
.
├── backend/
│   ├── bruno/            colección de requests de la API (Bruno)
│   ├── public/uploads/   imágenes subidas desde el panel (se crea sola)
│   └── src/
│       ├── config/       variables de entorno
│       ├── controllers/  traducen HTTP ↔ servicios
│       ├── domain/       errores y estados del negocio
│       ├── http/         formato de respuestas y validación
│       ├── middleware/   autenticación, subida de archivos, errores
│       ├── models/       modelos de MongoDB
│       ├── routes/       definición de endpoints
│       ├── schemas/      validaciones de entrada (Zod)
│       ├── scripts/      script de creación de la base (seed)
│       └── services/     lógica de negocio
├── frontend/
│   └── src/
│       ├── components/   componentes reutilizables (layout del panel, modal, tarjeta de producto...)
│       ├── context/      sesión del administrador
│       ├── pages/        una pantalla por archivo
│       ├── services/     llamadas a la API
│       ├── types/        tipos de los datos de la API
│       └── utils/        formato de precios y fechas
└── docs/
```

## Manual de instalación

### Requisitos

- Node.js 24 y npm 11. El proyecto usa solo Node y npm.
- Un cluster de [MongoDB Atlas](https://www.mongodb.com/atlas) (alcanza con el
  gratuito), con la IP de la máquina habilitada en *Network Access*. La búsqueda
  de productos usa Atlas Search, que no existe en un MongoDB local: sin Atlas el
  resto funciona, pero buscar por texto desde el panel responde un error.
- Opcional: una cuenta SMTP para enviar correos (por ejemplo, una contraseña de
  aplicación de Gmail o [Ethereal](https://ethereal.email/) para pruebas). Sin
  SMTP los correos se muestran en la consola del backend.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # en Windows: copy .env.example .env
```

Completar `.env`:

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `MONGODB_URI` | Sí | Cadena de conexión de Atlas, por ejemplo `mongodb+srv://usuario:clave@cluster.mongodb.net/techstore` |
| `JWT_SECRET` | Sí | Texto aleatorio de al menos 32 caracteres para firmar los tokens |
| `PORT` | No | Puerto de la API (por defecto `8080`) |
| `JWT_EXPIRATION_SECONDS` | No | Duración de la sesión (por defecto `3600`) |
| `SEED_ADMIN_PASSWORD` | No | Contraseña del administrador de demostración (por defecto `Admin123!`) |
| `FRONTEND_URL` | No | URL del frontend para los enlaces de los correos (por defecto `http://localhost:5173`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `MAIL_FROM` | No | Servidor de correo. Sin `SMTP_HOST`, los correos se escriben en la consola |

Crear la base con los datos de demostración e iniciar la API:

```bash
npm run seed
npm run dev
```

La API queda en `http://localhost:8080/api`.

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

El sitio queda en `http://localhost:5173`. En desarrollo, Vite reenvía `/api`
y `/uploads` al backend en el puerto 8080, así que no hace falta configurar
nada más.

### 3. Ingresar al panel

El panel de administración está en `http://localhost:5173/admin` (también se
llega desde el enlace **Administración** del pie de página).

- Usuario de demostración: `admin@example.com` / `Admin123!` (o la contraseña
  de `SEED_ADMIN_PASSWORD`).
- También se puede crear otra cuenta de administrador desde **Registrate** en la
  pantalla de inicio de sesión.

### Build de producción

```bash
cd backend && npm run build && npm start
cd frontend && npm run build   # genera frontend/dist para servir como sitio estático
```

En producción el frontend tiene que servirse detrás de un proxy que envíe
`/api` y `/uploads` al backend, igual que hace Vite en desarrollo.

## Base de datos

MongoDB crea las colecciones al insertar el primer documento y los índices se
definen en los modelos. El script `backend/src/scripts/seed.ts` cumple el rol de
script de creación de la base: `npm run seed` **borra** los datos existentes y
carga:

- 108 productos de tecnología en 11 categorías, con imágenes, algunos sin stock,
  algunos desactivados y algunos destacados;
- la información institucional del comercio;
- cuatro consultas en distintos estados;
- el administrador de demostración.

También crea (o actualiza) el índice de Atlas Search `productSearch`. Atlas
tarda unos minutos en indexar; mientras tanto la búsqueda puede devolver menos
resultados.

## Scripts

| Carpeta | Script | Qué hace |
| --- | --- | --- |
| `backend` | `npm run dev` | Compila ante cada cambio y reinicia la API |
| `backend` | `npm run seed` | Recrea la base con los datos de demostración |
| `backend` | `npm run build` / `npm start` | Compila a `dist` / ejecuta lo compilado |
| `backend` | `npm run typecheck`, `npm run lint`, `npm run format` | Tipos, ESLint y Prettier |
| `frontend` | `npm run dev` | Servidor de desarrollo de Vite |
| `frontend` | `npm run build` | Verifica tipos y genera `dist` |
| `frontend` | `npm run lint` | Oxlint |

## Probar la API

`backend/bruno` es una colección de [Bruno](https://www.usebruno.com/) con un
ejemplo documentado de cada endpoint. Abrirla en Bruno, elegir el entorno
`Local` y correr primero *Usuarios → Iniciar sesion como admin*: el token se
guarda solo y se usa en el resto de las requests.
