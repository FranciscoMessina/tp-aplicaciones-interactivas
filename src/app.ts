import "reflect-metadata";
import express from "express";
import { productRouter } from "./routes/product.routes.ts";

const app = express();

app.use(express.json());
app.use("/api/products", productRouter);

export { app };
