export const ContactFormStatus = {
  Pending: "PENDING",
  Read: "READ",
  Resolved: "RESOLVED",
} as const;

export type ContactFormStatus =
  (typeof ContactFormStatus)[keyof typeof ContactFormStatus];
