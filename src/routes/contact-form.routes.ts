import { Router } from "express";
import {
    createContactForm,
    getContactForms,
    deleteContacForm,
    updateContactFormStatus,
} from "../controllers/contact-form.controller.ts";
import { authenticate } from "../middleware/authenticate.ts";

const contactFormRouter = Router();

contactFormRouter.get("/", getContactForms);
contactFormRouter.post("/", authenticate, createContactForm);
contactFormRouter.patch("/:id", authenticate, updateContactFormStatus);
contactFormRouter.delete("/:id", authenticate, deleteContacForm);

export { contactFormRouter };