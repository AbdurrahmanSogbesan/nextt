import type { MemberUserDetails } from "@/lib/clerk-utils";
import { RotationOption } from "@prisma/client";

export type Rotation = "DAILY" | "WEEKLY" | string | null;

export type MemberWithProfile = {
  userId: string;
  position: number;
  isAdmin: boolean;
  dateJoined: string;
  profile: MemberUserDetails;
};

export type TurnWithUser = {
  turnUuid: string;
  status: string;
  dueDate: string | null;
  user: {
    userId: string | null;
    name: string | null;
    avatarUrl: string | null;
  };
};

export type ActivityItem = {
  id: number;
  title: string;
  createdAt: string;         // ISO
  meta?: unknown;
  actorId: string | null;
  body: string | null;
  hubId: number | null;
  rosterId: number | null;
  isDeleted: boolean;
  actor: MemberUserDetails | null;
};

export type CommentItem = {
  id: number;
  uuid: string;
  userId: string | null;
  content: string;
  createdAt: string;         // ISO
  rosterId: number | null;
  isDeleted: boolean;
  profile: MemberUserDetails | null;
};

export type GetRosterResponse = {
  scheduleNow: TurnWithUser | null;
  scheduleNext: TurnWithUser | null;
  members: MemberWithProfile[];
  /** Exactly 5 upcoming turns by dueDate */
  nextTurns: TurnWithUser[];
  activities: ActivityItem[];
  comments: CommentItem[];
  roster: {
    uuid: string;
    name: string;
    description: string | null;
    isPrivate: boolean;
    enablePushNotifications: boolean;
    enableEmailNotifications: boolean;
    start: string;
    end: string;
    rotationType: Rotation;
    hubId: number;
    createdById: string | null;
    currentTurnId: string | null;
    nextTurnId: string | null;
    nextDate: string | null;
    status: string; // STATUS_CHOICE
    rotationOption: RotationOption | null;
  };
};

export type CreateRosterForm = z.infer<typeof createRosterSchema>;