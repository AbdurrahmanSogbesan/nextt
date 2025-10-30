import { createUserMap } from "@/lib/clerk-utils";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { hubId } = await req.json();

    const notifications = await prisma.notification.findMany({
      where: {
        users: { has: userId },
        ...(hubId && { hubId: parseInt(hubId) }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        hub: true,
        roster: true,
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
      ].filter((id) => id != null)
    );

    const userMap = await createUserMap(Array.from(userIds));

    const enrichedNotifications = notifications.map((notification) => ({
      ...notification,
      hub: {
        ...notification.hub,
        owner: userMap.get(notification.hub?.ownerId ?? ""),
      },
      roster: {
        ...notification.roster,
        createdBy: userMap.get(notification.roster?.createdById ?? ""),
      },
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
