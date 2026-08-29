import { Router } from "express";
import {
  createContactForm,
  deleteContactForm,
  getContactForms,
  updateContactFormStatus,
} from "../controllers/contact-form.controller.ts";

const contactFormRouter = Router();

contactFormRouter.get("/", getContactForms);
contactFormRouter.post("/", createContactForm);
contactFormRouter.patch("/:id", updateContactFormStatus);
contactFormRouter.delete("/:id", deleteContactForm);

export { contactFormRouter };
