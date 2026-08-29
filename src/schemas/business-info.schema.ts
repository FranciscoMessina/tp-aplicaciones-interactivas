import { z } from "zod";

export const saveBusinessInfoSchema = {
  body: z.object({
    name: z.string().trim().min(1),
    description: z.string().trim().min(1),
    address: z.string().trim().min(1),
    phone: z.string().trim().min(1),
    socialNetworks: z.array(z.url()),
    openingHours: z.array(z.string().trim().min(1)),
  }),
};
