import { Router } from "express";
import {
  createCollection,
  deleteCollection,
  getCollection,
  listCollections,
  updateCollection,
} from "../controllers/collection.controller.ts";
import {
  authenticate,
  optionalAuthenticate,
  requireAdmin,
} from "../middleware/auth.ts";

const collectionRouter = Router();

collectionRouter.get("/", optionalAuthenticate, listCollections);
collectionRouter.get("/:id", optionalAuthenticate, getCollection);
collectionRouter.post("/", authenticate, requireAdmin, createCollection);
collectionRouter.patch("/:id", authenticate, requireAdmin, updateCollection);
collectionRouter.delete("/:id", authenticate, requireAdmin, deleteCollection);

export { collectionRouter };
