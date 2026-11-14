import { z } from "zod";

export const saveBusinessInfoSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(2000),
  address: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(40),
  socialNetworks: z.array(z.url().max(300)).max(10),
  // Un renglon por dia o franja ("Lunes a viernes de 9 a 18").
  openingHours: z.array(z.string().trim().min(1).max(120)).max(14),
});
