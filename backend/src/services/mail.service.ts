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

/**
 * Un mail que no sale no tiene que romper la operacion que lo dispara (la
 * consulta ya quedo guardada, el token ya se genero): el error se registra en
 * la consola y nada mas.
 */
async function sendMail(mail: Mail): Promise<void> {
  if (!transporter || !env.smtp) {
    console.log(
      `[mail] Para: ${String(mail.to)}\n[mail] Asunto: ${mail.subject}\n${mail.text}`,
    );
    return;
  }

  try {
    await transporter.sendMail({ from: env.smtp.from, ...mail });
  } catch (error) {
    console.error("No se pudo enviar el mail:", error);
  }
}

export function sendPasswordResetEmail(email: string, token: string): void {
  const link = `${env.frontendUrl}/restablecer-contrasena?token=${token}`;

  void sendMail({
    to: email,
    subject: "Recuperá tu contraseña",
    text: `Recibimos un pedido para restablecer tu contraseña.\n\nIngresá a este enlace para elegir una nueva (vence en 15 minutos):\n${link}\n\nSi no fuiste vos, ignorá este mensaje.`,
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
    void sendMail({
      to: adminEmails,
      replyTo: enquiry.email,
      subject: `Nueva consulta: ${enquiry.subject}`,
      text: `${enquiry.name} (${enquiry.email}${enquiry.phone ? `, ${enquiry.phone}` : ""}) escribió:\n\n${enquiry.message}\n\nGestioná las consultas en ${env.frontendUrl}/admin/consultas`,
    });
  }

  void sendMail({
    to: enquiry.email,
    subject: `Recibimos tu consulta: ${enquiry.subject}`,
    text: `Hola ${enquiry.name}, gracias por escribirnos. Recibimos tu consulta y te vamos a responder a la brevedad.\n\nTu mensaje:\n${enquiry.message}`,
  });
}
