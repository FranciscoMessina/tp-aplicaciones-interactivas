import "reflect-metadata";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.ts";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "./domain/application-error.ts";
import { errorHandler } from "./middleware/error-handler.ts";
import { productRouter } from "./routes/product.routes.ts";
import { userRouter } from "./routes/user.routes.ts";
import { categoryRouter } from "./routes/category.routes.ts";
import { businessInfoRouter } from "./routes/business-info.routes.ts";
import { enquiryRouter } from "./routes/enquiry.routes.ts";
import { imageRouter } from "./routes/image.routes.ts";
import { statsRouter } from "./routes/stats.routes.ts";
import { promotionRouter } from "./routes/promotion.routes.ts";
import { collectionRouter } from "./routes/collection.routes.ts";

const app = express();

app.set("trust proxy", env.trustProxyHops);

// El orden de los `app.use` importa: Express pasa cada request por estas
// funciones de arriba hacia abajo.

// Agrega headers de seguridad estandar a todas las respuestas: que el navegador
// no adivine el tipo de un archivo, que la API no se pueda embeber en un
// iframe, que no se informe el framework, etc. Las imagenes de `/uploads` se
// muestran desde el front, que esta en otro origen: por eso se permite que
// otros origenes las carguen.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
// Escribe en consola una linea por cada request (metodo, ruta, status y tiempo
// de respuesta). Va primero para registrar tambien los que terminan en error.
// En desarrollo usa un formato corto y con colores; en produccion, el formato
// estandar de los servidores web, que incluye IP y navegador del cliente.
app.use(morgan(env.isProduction ? "combined" : "dev"));
// El front corre en otro origen (otro puerto o dominio) y el navegador bloquea
// esas llamadas salvo que la API las autorice con los headers de CORS. Solo se
// autoriza el origen del comercio, no cualquier sitio.
app.use(cors({ origin: env.frontendUrl }));
// Convierte el cuerpo JSON del request en un objeto disponible en `req.body`.
app.use(express.json());
// Sirve tal cual los archivos de la carpeta `public`: `public/uploads/foto.jpg`
// queda disponible en `/uploads/foto.jpg`. Ahi se guardan las imagenes subidas.
app.use(express.static("public"));

app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/users", userRouter);
app.use("/api/business-info", businessInfoRouter);
app.use("/api/enquiries", enquiryRouter);
app.use("/api/images", imageRouter);
app.use("/api/stats", statsRouter);
app.use("/api/promotions", promotionRouter);
app.use("/api/collections", collectionRouter);

// Si el request llego hasta aca, ninguna ruta coincidio.
app.use(() => {
  throw new ApplicationError(
    ApplicationErrorKind.NotFound,
    "La ruta no existe",
  );
});

// Va ultimo para recibir los errores de todo lo anterior.
app.use(errorHandler);

export { app };
