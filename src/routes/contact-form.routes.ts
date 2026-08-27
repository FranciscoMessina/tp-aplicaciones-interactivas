import { Router } from "express";
import {
    createContactForm,
    getContactForms,
    deleteContacForm,
    updateContactForm,
} from "../controllers/contact-form.controller.ts";
import { authenticate } from "../middleware/authenticate.ts";

const productRouter = Router();

productRouter.get("/", getContactForms);
productRouter.post("/", authenticate, createContactForm);
productRouter.patch("/:id", authenticate, updateContactForm);
productRouter.delete("/:id", authenticate, deleteContacForm);

export { contactFormRouter };