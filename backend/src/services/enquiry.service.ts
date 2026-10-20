import type { DocumentType } from "@typegoose/typegoose";
import {
  ApplicationError,
  ApplicationErrorKind,
} from "../domain/application-error.ts";
import {
  EnquiryStatus,
  type EnquiryStatus as EnquiryStatusValue,
} from "../domain/enquiry.ts";
import { Enquiry, EnquiryModel } from "../models/enquiry.model.ts";
import { sendEnquiryEmails, sendEnquiryReplyEmail } from "./mail.service.ts";
import { getUserProfile, listAdminEmails } from "./user.service.ts";

export interface CreateEnquiryInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface EnquiryFilters {
  status?: EnquiryStatusValue;
  page: number;
  pageSize: number;
}

export interface EnquiryPage {
  items: DocumentType<Enquiry>[];
  page: number;
  pageSize: number;
  total: number;
}

/** La bandeja crece con cada consulta, asi que se lee de a paginas. */
export async function listEnquiries({
  status,
  page,
  pageSize,
}: EnquiryFilters): Promise<EnquiryPage> {
  const filter = status ? { status } : {};
  const [items, total] = await Promise.all([
    EnquiryModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    EnquiryModel.countDocuments(filter),
  ]);

  return { items, page, pageSize, total };
}

/**
 * Le manda la respuesta por mail al visitante y la guarda en la consulta, que
 * queda como respondida. Primero se envia: si el mail no sale, no se registra
 * una respuesta que el visitante nunca recibio.
 */
export async function replyToEnquiry(
  enquiryId: string,
  authorId: string,
  message: string,
): Promise<DocumentType<Enquiry>> {
  const [enquiry, author] = await Promise.all([
    EnquiryModel.findById(enquiryId),
    getUserProfile(authorId),
  ]);

  if (!enquiry) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró la consulta",
    );
  }

  try {
    await sendEnquiryReplyEmail(enquiry, {
      message,
      authorName: author.fullName,
      authorEmail: author.email,
    });
  } catch (error) {
    console.error("No se pudo enviar la respuesta:", error);
    throw new ApplicationError(
      ApplicationErrorKind.Unexpected,
      "No se pudo enviar la respuesta por correo. Intentá de nuevo en unos minutos",
    );
  }

  const updated = await EnquiryModel.findByIdAndUpdate(
    enquiryId,
    {
      $push: { replies: { message, authorName: author.fullName } },
      $set: { status: EnquiryStatus.Resolved },
    },
    { returnDocument: "after", runValidators: true },
  );

  // Se elimino mientras se enviaba el mail: el visitante igual la recibio.
  if (!updated) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "La respuesta se envió, pero la consulta ya había sido eliminada",
    );
  }

  return updated;
}

export async function createEnquiry(
  input: CreateEnquiryInput,
): Promise<DocumentType<Enquiry>> {
  const enquiry = await EnquiryModel.create({
    ...input,
    status: EnquiryStatus.Pending,
  });

  sendEnquiryEmails(input, await listAdminEmails());
  return enquiry;
}

/**
 * El cambio se hace en una sola operacion, con el estado anterior como
 * condicion: si dos administradores cambian la misma consulta a la vez, el
 * segundo ya no la encuentra en un estado valido y recibe un conflicto en vez
 * de pisar el cambio del primero.
 */
export async function updateEnquiryStatus(
  enquiryId: string,
  nextStatus: EnquiryStatusValue,
): Promise<DocumentType<Enquiry>> {
  const previousStatuses = Object.values(EnquiryStatus).filter((status) =>
    allowedTransitions[status].includes(nextStatus),
  );
  const updated = await EnquiryModel.findOneAndUpdate(
    { _id: enquiryId, status: { $in: previousStatuses } },
    { $set: { status: nextStatus } },
    { returnDocument: "after", runValidators: true },
  );

  if (updated) {
    return updated;
  }

  // No se actualizo: o no existe, o ya estaba en ese estado, o la transicion
  // no esta permitida.
  const enquiry = await EnquiryModel.findById(enquiryId);

  if (!enquiry) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró la consulta",
    );
  }

  if (enquiry.status === nextStatus) {
    return enquiry;
  }

  throw new ApplicationError(
    ApplicationErrorKind.Conflict,
    `No se puede cambiar una consulta de ${enquiry.status} a ${nextStatus}`,
  );
}

export async function deleteEnquiry(enquiryId: string): Promise<void> {
  const enquiry = await EnquiryModel.findByIdAndDelete(enquiryId);

  if (!enquiry) {
    throw new ApplicationError(
      ApplicationErrorKind.NotFound,
      "No se encontró la consulta",
    );
  }
}

/**
 * A que estados puede pasar una consulta desde cada estado. Siempre se puede
 * volver a pendiente, por ejemplo para retomar una consulta; lo unico que no
 * se permite es "des-responder" una consulta y dejarla como solo leida.
 */
const allowedTransitions: Record<EnquiryStatusValue, EnquiryStatusValue[]> = {
  [EnquiryStatus.Pending]: [EnquiryStatus.Read, EnquiryStatus.Resolved],
  [EnquiryStatus.Read]: [EnquiryStatus.Pending, EnquiryStatus.Resolved],
  [EnquiryStatus.Resolved]: [EnquiryStatus.Pending],
};
