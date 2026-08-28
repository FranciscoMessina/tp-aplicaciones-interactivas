import { Router } from "express";
import {
    createContactForm,
    getContactForms,
    deleteContactForm,
    updateContactFormStatus,
} from "../controllers/contact-form.controller.ts";
import { authenticate } from "../middleware/authenticate.ts";
import { requireAdmin } from "../middleware/authorize.ts";

const contactFormRouter = Router();

contactFormRouter.get("/", authenticate, requireAdmin, getContactForms);
contactFormRouter.post("/", createContactForm);
contactFormRouter.patch("/:id", authenticate, requireAdmin, updateContactFormStatus);
contactFormRouter.delete("/:id", authenticate, requireAdmin, deleteContactForm);

export { contactFormRouter };
