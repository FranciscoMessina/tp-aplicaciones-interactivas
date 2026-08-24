import type { Request, Response } from "express";
import { ProductModel } from "../models/product.model.ts";

export const getProducts = async (_req: Request, res: Response) => {
  try {
    const products = await ProductModel.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Unable to retrieve products", error });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const newProduct = new ProductModel(req.body);
    const product = await newProduct.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: "Unable to create product", error });
  }
};
