import { ROTATION_CHOICE, VISIBILITY_CHOICE } from "@prisma/client";
import { z } from "zod";

// HUB
export const createHubSchema = z.object({
  name: z.string().min(2, "Name is required"),
  logoUrl: z.url().nullable().optional(),
  theme: z.string().optional().or(z.literal("")),
  visibility: z.enum(VISIBILITY_CHOICE),
  description: z.string().max(500).optional(),
});

export const updateHubMemberRoleSchema = z.object({
  isAdmin: z.boolean(),
  memberUserId: z.string().min(1, "Member user ID is required"),
});

export const createRosterSchema = z.object({
  hubId: z.number().int().positive(),
  name: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  rotationChoice: z.enum(ROTATION_CHOICE).optional(),
  start: z.coerce.date(),
  end: z.coerce.date(),
  enablePushNotifications: z.boolean().default(true),
  emailNotificationIsEnabled: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
  inlcudeAllHubMembers: z.boolean().default(false),
}).refine((d) => d.end > d.start, {
  message: "End must be after start",
  path: ["end"],
});

export const patchRosterSchema = z.object({
  name: z.string().min(2, "Title is required").optional(),
  description: z.string().optional(),
  rotationChoice: z.enum(ROTATION_CHOICE).optional(),
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
  enablePushNotifications: z.boolean().optional(),
  emailNotificationIsEnabled: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
});
