export const EnquiryStatus = {
  Pending: "PENDING",
  Read: "READ",
  Resolved: "RESOLVED",
} as const;

export type EnquiryStatus = (typeof EnquiryStatus)[keyof typeof EnquiryStatus];
