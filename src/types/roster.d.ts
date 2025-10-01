import { createRosterSchema } from "@/lib/schemas";

export type CreateRosterForm = z.infer<typeof createRosterSchema>;
