import "reflect-metadata";
import cors from "cors";
import express from "express";
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

const app = express();

// El orden de los `app.use` importa: Express pasa cada request por estas
// funciones de arriba hacia abajo.

// El front corre en otro origen (otro puerto o dominio) y el navegador bloquea
// esas llamadas salvo que la API las autorice con los headers de CORS.
app.use(cors());
// Convierte el cuerpo JSON del request en un objeto disponible en `req.body`.
app.use(express.json());

app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/users", userRouter);
app.use("/api/business-info", businessInfoRouter);
app.use("/api/enquiries", enquiryRouter);

// Si el request llego hasta aca, ninguna ruta coincidio.
app.use(() => {
  throw new ApplicationError(ApplicationErrorKind.NotFound, "Route not found");
});

// Va ultimo para recibir los errores de todo lo anterior.
app.use(errorHandler);

export { app };
