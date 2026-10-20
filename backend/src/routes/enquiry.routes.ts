import { Router } from "express";
import {
  createEnquiry,
  deleteEnquiry,
  listEnquiries,
  replyToEnquiry,
  updateEnquiryStatus,
} from "../controllers/enquiry.controller.ts";
import { authenticate, requireAdmin } from "../middleware/auth.ts";
import { enquiryLimiter } from "../middleware/rate-limit.ts";

const enquiryRouter = Router();

// Cualquier visitante puede dejar una consulta; el resto es del administrador.
enquiryRouter.post("/", enquiryLimiter, createEnquiry);
enquiryRouter.get("/", authenticate, requireAdmin, listEnquiries);
enquiryRouter.patch("/:id", authenticate, requireAdmin, updateEnquiryStatus);
enquiryRouter.post("/:id/replies", authenticate, requireAdmin, replyToEnquiry);
enquiryRouter.delete("/:id", authenticate, requireAdmin, deleteEnquiry);

export { enquiryRouter };
