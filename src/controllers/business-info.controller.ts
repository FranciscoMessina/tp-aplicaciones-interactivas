import type { Request, Response } from "express";
import * as businessInfoService from "../services/business-info.service.ts";
import type { BusinessInfoInput } from "../services/business-info.service.ts";
import {
  getRequestBody,
  readStringArray,
  readTrimmedString,
} from "../utils/validation.ts";

export async function getBusinessInfo(
  _req: Request,
  res: Response,
): Promise<void> {
  const businessInfo = await businessInfoService.getBusinessInfo();

  if (!businessInfo) {
    res.status(404).json({
      message: "Business information not found",
    });
    return;
  }

  res.json(businessInfo);
}

export async function saveBusinessInfo(
  req: Request,
  res: Response,
): Promise<void> {
  const body = getRequestBody(req);

  const name = readTrimmedString(body.name);
  const description = readTrimmedString(body.description);
  const address = readTrimmedString(body.address);
  const phone = readTrimmedString(body.phone);
  const socialNetworks = readStringArray(body.socialNetworks);
  const openingHours = readStringArray(body.openingHours);

  if (!name || !description || !address || !phone) {
    res.status(400).json({
      message: "name, description, address and phone are required",
    });
    return;
  }

  if (!socialNetworks || !openingHours) {
    res.status(400).json({
      message: "socialNetworks and openingHours must be arrays of strings",
    });
    return;
  }

  const input: BusinessInfoInput = {
    name,
    description,
    address,
    phone,
    socialNetworks,
    openingHours,
  };

  const businessInfo =
    await businessInfoService.upsertBusinessInfo(input);

  res.json(businessInfo);
}