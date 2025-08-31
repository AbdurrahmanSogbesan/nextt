import { VISIBILITY_CHOICE } from "@prisma/client";
import { z } from "zod";

// HUB
export const createHubSchema = z.object({
  name: z.string().min(2, "Name is required"),
  logoUrl: z.url().nullable().optional(),
  theme: z.string().optional().or(z.literal("")),
  visibility: z.enum(VISIBILITY_CHOICE),
  description: z.string().max(500).optional(),
});
