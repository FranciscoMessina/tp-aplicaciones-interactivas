import type { Request, Response } from "express";
import * as contactFormService from "../services/contact-form.service.ts";
import {ContactFormStatus} from "../models/contact-form.model.ts";
import type {
    CreateContactFormInput,
    UpdateContactFormInput,
} from "../services/contact-form.service.service.ts";
import {
    getRequestBody,
    readBoolean,
    readOptionalNonNegativeNumber,
    readRouteParam,
    readStringArray,
    readTrimmedString,
} from "../utils/validation.ts";

function getContactFormId(req: Request): string {
    return readRouteParam(req.params.id);
}

export async function getContactForms(
    req: Request,
    res: Response,
): Promise<void> {
    try {
        const contactForms = await contactFormService.getContactForms()
        res.status(200).json(contactForms);
    }catch (error:any) {
        res.status(500).json({message: error.message});
    }
}

export async function createContactForm(
    req: Request,
    res: Response,
): Promise<void> {
    const body = getRequestBody(req);
    const name = readTrimmedString(body.name);
    const email = readTrimmedString(body.email);
    const phone = readOptionalNonNegativeNumber(body.phone);
    const subject = readTrimmedString(body.subject);
    const message = readTrimmedString(body.message);
    //tengo dudas con esto del status porque es una clase enum
    const status = readOptionalNonNegativeNumber(body.status);

    if (!name || !email || !subject || message) {
        res.status(400).json({
            message:
                "name, email, subject, message are required",
        });
        return;
    }

    const input: CreateContactFormInput = { name, email, subject, message, status };
    if (phone !== undefined) {
        input.phone = phone;
    }

    const contactForm = await contactFormService.createContactForm(input);
    res.status(201).json(product);
}

export async function updateContactForm(
    req: Request,
    res: Response,
): Promise<void> {
    const body = getRequestBody(req);
    const updates: UpdateContactFormInput = {};

    if (body.name !== undefined) {
        updates.name = readTrimmedString(body.name);
    }
    if (body.email !== undefined) {
        updates.email = readTrimmedString(body.email);
    }
    if (body.subject !== undefined) {
        updates.subject = readTrimmedString(body.subject);
    }
    if (body.message !== undefined) {
        updates.message = readTrimmedString(body.message);
    }
    if (body.status !== undefined) {
        updates.status = readOptionalNonNegativeNumber(body.status);
    }

    const phone = readOptionalNonNegativeNumber(body.phone);

    if (phone !== undefined) {
        updates.phone = phone;
    }

    if (
        Object.keys(updates).length === 0 ||
        (updates.name !== undefined && !updates.name) ||
        (updates.email !== undefined && !updates.email) ||
        (updates.subject !== undefined && !updates.subject)||
        (updates.message !== undefined && !updates.message)
    ) {
        res.status(400).json({
            message:
                "Provide a valid name, email, subject, message",
        });
        return;
    }

    const contactForm = await contactFormService.updateContactForm(
        getContactFormId(req),
        updates,
    );
    res.json(contactForm);
}

export async function deleteContacForm(
    req: Request,
    res: Response,
): Promise<void> {
    await contactFormService.deleteContactForm(getContactFormId(req));
    res.status(204).send();
}

