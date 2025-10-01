import {
  ROTATION_CHOICE,
  ROTATION_TYPE,
  VISIBILITY_CHOICE,
} from "@prisma/client";
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

const MemberInput = z.object({
  userId: z.string().min(1),
  position: z.number().int().positive(),
});

export const createRosterSchema = z.object({
  hubId: z.number().int().positive(),
  name: z.string().min(2, "Title is required"),
  description: z.string().optional(),
  rotationType: z.enum(ROTATION_CHOICE),
  // note: include output type of coerced values
  start: z.coerce.date<Date>(),
  end: z.coerce.date<Date>(),
  enablePushNotifications: z.boolean(),
  enableEmailNotifications: z.boolean(),
  isPrivate: z.boolean(),
  includeAllHubMembers: z.boolean(),
  members: z.array(MemberInput).optional(),
  rotationOption: z
    .object({
      rotation: z.enum(ROTATION_TYPE),
      // need to specity output type otherwise react-hook-form loses its shit
      unit: z.coerce.number<number>().positive(),
    })
    .optional(),
});

export const patchRosterSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  rotationType: z.enum(ROTATION_CHOICE).optional(),
  start: z.coerce.date<Date>().optional(),
  end: z.coerce.date<Date>().optional(),
  enablePushNotifications: z.boolean().optional(),
  enableEmailNotifications: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  rotationOption: z
    .object({
      rotation: z.enum(ROTATION_TYPE),
      unit: z.coerce.number<number>(),
    })
    .optional(),
  members: z.array(MemberInput).optional(),
});
