import "reflect-metadata";
import express from "express";
import { errorHandler } from "./middleware/error-handler.ts";
import { productRouter } from "./routes/product.routes.ts";
import { userRouter } from "./routes/user.routes.ts";
import { categoryRouter } from "./routes/category.routes.ts";
import { businessInfoRouter } from "./routes/business-info.routes.ts";
import { enquiryRouter } from "./routes/enquiry.routes.ts";

const app = express();

app.use(express.json());

app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/users", userRouter);
app.use("/api/business-info", businessInfoRouter);
app.use("/api/enquiries", enquiryRouter);

app.use(errorHandler);

export { app };
