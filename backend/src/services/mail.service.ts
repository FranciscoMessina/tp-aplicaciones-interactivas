import nodemailer from "nodemailer";
import { env } from "../config/env.ts";

interface Mail {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
}

// Se crea una sola vez. Sin SMTP configurado no hay transporte y los mails
// se escriben en la consola, asi el proyecto funciona sin cuenta de correo.
// Eso solo pasa en desarrollo: en produccion env.ts exige SMTP.
const transporter = env.smtp
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user
        ? { user: env.smtp.user, pass: env.smtp.password }
        : undefined,
    })
  : undefined;

/** Envia el mail y falla si el servidor SMTP lo rechaza. */
async function sendMail(mail: Mail): Promise<void> {
  if (!transporter || !env.smtp) {
    console.log(
      `[mail] Para: ${String(mail.to)}\n[mail] Asunto: ${mail.subject}\n${mail.text}`,
    );
    return;
  }

  await transporter.sendMail({ from: env.smtp.from, ...mail });
}

/**
 * Para los avisos: un mail que no sale no tiene que romper la operacion que lo
 * dispara (la consulta ya quedo guardada, el token ya se genero), asi que no se
 * espera y el error solo se registra en la consola.
 */
function sendMailInBackground(mail: Mail): void {
  sendMail(mail).catch((error: unknown) => {
    console.error("No se pudo enviar el mail:", error);
  });
}

export function sendPasswordResetEmail(email: string, token: string): void {
  const link = `${env.frontendUrl}/restablecer-contrasena?token=${token}`;

  sendMailInBackground({
    to: email,
    subject: "Recuperá tu contraseña",
    text: `Recibimos un pedido para restablecer tu contraseña.\n\nIngresá a este enlace para elegir una nueva (vence en 15 minutos):\n${link}\n\nSi no fuiste vos, ignorá este mensaje.`,
  });
}

export function sendInvitationEmail(
  email: string,
  fullName: string,
  token: string,
): void {
  const link = `${env.frontendUrl}/restablecer-contrasena?token=${token}&invitacion=1`;

  sendMailInBackground({
    to: email,
    subject: "Te invitaron al panel de administración",
    text: `Hola ${fullName}, te crearon una cuenta de administrador del comercio.\n\nIngresá a este enlace para elegir tu contraseña (vence en 72 horas):\n${link}\n\nSi vence, pedí uno nuevo desde "¿Olvidaste tu contraseña?" en ${env.frontendUrl}/login`,
  });
}

export interface EnquiryMail {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

/** Avisa a los administradores y le confirma la recepcion al visitante. */
export function sendEnquiryEmails(
  enquiry: EnquiryMail,
  adminEmails: string[],
): void {
  if (adminEmails.length > 0) {
    sendMailInBackground({
      to: adminEmails,
      replyTo: enquiry.email,
      subject: `Nueva consulta: ${enquiry.subject}`,
      text: `${enquiry.name} (${enquiry.email}${enquiry.phone ? `, ${enquiry.phone}` : ""}) escribió:\n\n${enquiry.message}\n\nGestioná las consultas en ${env.frontendUrl}/admin/consultas`,
    });
  }

  sendMailInBackground({
    to: enquiry.email,
    subject: `Recibimos tu consulta: ${enquiry.subject}`,
    text: `Hola ${enquiry.name}, gracias por escribirnos. Recibimos tu consulta y te vamos a responder a la brevedad.\n\nTu mensaje:\n${enquiry.message}`,
  });
}

/**
 * La respuesta a una consulta, escrita desde el panel. A diferencia de los
 * avisos, se espera el envio: si falla, quien responde tiene que enterarse.
 * Si el visitante contesta el mail, le llega a quien respondio.
 */
export function sendEnquiryReplyEmail(
  enquiry: EnquiryMail,
  reply: { message: string; authorName: string; authorEmail: string },
): Promise<void> {
  const quoted = enquiry.message
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");

  return sendMail({
    to: enquiry.email,
    replyTo: reply.authorEmail,
    subject: `Re: ${enquiry.subject}`,
    text: `Hola ${enquiry.name},\n\n${reply.message}\n\n${reply.authorName}\n\nTu consulta:\n${quoted}`,
  });
}
