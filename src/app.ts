import "reflect-metadata";
import cors from "cors";
import express from "express";
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

const app = express();

// El orden de los `app.use` importa: Express pasa cada request por estas
// funciones de arriba hacia abajo.

// Escribe en consola una linea por cada request (metodo, ruta, status y tiempo
// de respuesta). Va primero para registrar tambien los que terminan en error.
// En desarrollo usa un formato corto y con colores; en produccion, el formato
// estandar de los servidores web, que incluye IP y navegador del cliente.
app.use(morgan(env.isProduction ? "combined" : "dev"));
// El front corre en otro origen (otro puerto o dominio) y el navegador bloquea
// esas llamadas salvo que la API las autorice con los headers de CORS.
app.use(cors());
// Convierte el cuerpo JSON del request en un objeto disponible en `req.body`.
app.use(express.json());
// Sirve tal cual los archivos de la carpeta `public`: `public/uploads/foto.jpg`
// queda disponible en `/uploads/foto.jpg`. Ahi se guardan las imagenes subidas.
app.use(express.static("public"));

// Cuando tengamos el front con IP/dominio agregamos un middleware para que solo permita requests desde esa IP/dominio.

app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/users", userRouter);
app.use("/api/business-info", businessInfoRouter);
app.use("/api/enquiries", enquiryRouter);
app.use("/api/images", imageRouter);

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
