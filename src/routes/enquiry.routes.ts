import { Router } from "express";
import {
  createEnquiry,
  deleteEnquiry,
  listEnquiries,
  updateEnquiryStatus,
} from "../controllers/enquiry.controller.ts";
import { authenticate, requireAdmin } from "../middleware/auth.ts";

const enquiryRouter = Router();

// Cualquier visitante puede dejar una consulta; el resto es del administrador.
enquiryRouter.post("/", createEnquiry);
enquiryRouter.get("/", authenticate, requireAdmin, listEnquiries);
enquiryRouter.patch("/:id", authenticate, requireAdmin, updateEnquiryStatus);
enquiryRouter.delete("/:id", authenticate, requireAdmin, deleteEnquiry);

export { enquiryRouter };
