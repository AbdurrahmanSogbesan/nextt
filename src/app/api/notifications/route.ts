import { createUserMap } from "@/lib/clerk-utils";
import prisma from "@/lib/prisma";
import { NotificationFilter } from "@/types/notification";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") as NotificationFilter;

    const notifications = await prisma.notification.findMany({
      where: {
        users: { has: userId },
        ...(filter === "invitations" && { inviteId: { not: null } }),
        ...(filter === "tasks" && { turnId: { not: null } }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        hub: true,
        roster: true,
        invite: true,
        turn: true,
      },
    });

    const userIds = new Set(
      [
        ...notifications
          .map((notification) => notification.hub?.ownerId)
          .filter(Boolean),
        ...notifications.map(
          (notification) => notification.roster?.createdById
        ),
        ...notifications.map((notification) => notification.invite?.fromId),
      ].filter((id) => id != null)
    );

    const userMap = await createUserMap(Array.from(userIds));

    const enrichedNotifications = notifications.map((notification) => ({
      ...notification,
      hub: notification.hub
        ? {
            ...notification.hub,
            owner: userMap.get(notification.hub.ownerId ?? ""),
          }
        : null,
      roster: notification.roster
        ? {
            ...notification.roster,
            createdBy: userMap.get(notification.roster.createdById ?? ""),
          }
        : null,
      invite: notification.invite
        ? {
            ...notification.invite,
            from: userMap.get(notification.invite.fromId ?? ""),
          }
        : null,
    }));

    return NextResponse.json({
      notifications: enrichedNotifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
