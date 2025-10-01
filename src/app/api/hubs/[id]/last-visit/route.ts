import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First verify the hub exists and user has access
    const hub = await prisma.hub.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        visibility: true,
        lastVisitedUsers: true,
        members: { select: { hubUserid: true } },
      },
    });

    if (!hub) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    // Check if user is a member of the hub
    const isMember = hub.members.some((m) => m.hubUserid === userId);
    if (!isMember && hub.visibility === "PRIVATE") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Only update if user is not already in lastVisitedUsers
    if (!hub.lastVisitedUsers?.includes(userId)) {
      // Get all hubs where user is currently in lastVisitedUsers
      const hubsWithUser = await prisma.hub.findMany({
        where: { lastVisitedUsers: { has: userId } },
        select: { id: true, lastVisitedUsers: true },
      });

      const updates = [
        // Add user to current hub visitors
        prisma.hub.update({
          where: { id: hub.id },
          data: { lastVisitedUsers: { push: userId } },
        }),
      ];

      // Remove user from all other hubs visitors
      hubsWithUser
        .filter((h) => h.id !== hub.id)
        .forEach((otherHub) => {
          updates.push(
            prisma.hub.update({
              where: { id: otherHub.id },
              data: {
                lastVisitedUsers: {
                  set: otherHub.lastVisitedUsers.filter((id) => id !== userId),
                },
              },
            })
          );
        });

      await prisma.$transaction(updates);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating lastVisitedUsers:", error);
    return NextResponse.json(
      { error: "Failed to update visit status" },
      { status: 500 }
    );
  }
}
