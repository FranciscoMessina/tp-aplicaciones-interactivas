import { Router } from "express";
import {
  createEnquiry,
  deleteEnquiry,
  getEnquiries,
  updateEnquiryStatus,
} from "../controllers/enquiry.controller.ts";

const enquiryRouter = Router();

enquiryRouter.get("/", getEnquiries);
enquiryRouter.post("/", createEnquiry);
enquiryRouter.patch("/:id", updateEnquiryStatus);
enquiryRouter.delete("/:id", deleteEnquiry);

export { enquiryRouter };
