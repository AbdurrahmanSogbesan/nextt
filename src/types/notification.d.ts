import { Prisma } from "@prisma/client";

type PrismaNotification = Prisma.NotificationGetPayload<{
  include: {
    hub: true;
    roster: true;
  };
}>;

export type NotificationHub = PrismaNotification["hub"] & {
  owner: MemberUserDetails;
};

export type NotificationRoster = PrismaNotification["roster"] & {
  createdBy: MemberUserDetails;
};

export type GetNotificationsResponse = {
  notifications: (PrismaNotification & {
    hub: NotificationHub;
    roster: NotificationRoster;
  })[];
};
