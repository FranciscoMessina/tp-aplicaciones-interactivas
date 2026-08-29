import { Router } from "express";
import {
  createEnquiry,
  deleteEnquiry,
  listEnquiries,
  updateEnquiryStatus,
} from "../controllers/enquiry.controller.ts";

const enquiryRouter = Router();

enquiryRouter.get("/", listEnquiries);
enquiryRouter.post("/", createEnquiry);
enquiryRouter.patch("/:id", updateEnquiryStatus);
enquiryRouter.delete("/:id", deleteEnquiry);

export { enquiryRouter };
