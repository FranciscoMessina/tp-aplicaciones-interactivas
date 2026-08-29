import { z } from "zod";
import { objectIdSchema } from "./common.schema.ts";

const categoryBody = z.object({ name: z.string().trim().min(1) });
const categoryParams = z.object({ id: objectIdSchema });

export const createCategorySchema = { body: categoryBody };
export const updateCategorySchema = {
  params: categoryParams,
  body: categoryBody,
};
export const categoryIdSchema = { params: categoryParams };
