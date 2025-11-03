import { Prisma } from "@prisma/client";
import { MemberUserDetails } from "./index";

type PrismaNotification = Prisma.NotificationGetPayload<{
  include: {
    hub: true;
    roster: true;
    invite: true;
    turn: true;
  };
}>;

export type NotificationHub = PrismaNotification["hub"] & {
  owner: MemberUserDetails;
};

export type NotificationRoster = PrismaNotification["roster"] & {
  createdBy: MemberUserDetails;
};

export type NotificationInvite = PrismaNotification["invite"] & {
  from: MemberUserDetails;
};

export type EnrichedNotification = PrismaNotification & {
  hub: NotificationHub | null;
  roster: NotificationRoster | null;
  invite: NotificationInvite | null;
};

export type GetNotificationsResponse = {
  notifications: EnrichedNotification[];
};

export type NotificationFilter = "all" | "invitations" | "tasks";
