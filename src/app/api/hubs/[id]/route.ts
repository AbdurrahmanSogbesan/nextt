import prisma from "@/lib/prisma";
import { createUserMap } from "@/lib/clerk-utils";
import { getUserInfo } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbhub = await prisma.hub.findUnique({
      where: { id: parseInt(id), isDeleted: false },
      include: {
        members: {
          where: { isDeleted: false },
          orderBy: { dateJoined: "desc" },
        },
        rosters: {
          where: { isDeleted: false },
          include: { members: { where: { isDeleted: false } } },
        },
        activities: {
          where: { isDeleted: false },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!dbhub) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    const uniqueIds = new Set([
      ...dbhub.members.map((m) => m.hubUserid),
      ...dbhub.rosters.flatMap((ros) =>
        ros.members.map((rom) => rom.rosterUserId)
      ),
    ]);

    const userMap = await createUserMap(Array.from(uniqueIds));

    // Enrich hub data with user information
    const hub = {
      ...dbhub,
      members: dbhub.members.map((member) => ({
        ...member,
        user: getUserInfo(userMap, member.hubUserid),
      })),
      rosters: dbhub.rosters.map((roster) => ({
        ...roster,
        members: roster.members.map((member) => ({
          ...member,
          user: getUserInfo(userMap, member.rosterUserId),
        })),
      })),
      activities: dbhub.activities.map((activity) => ({
        ...activity,
        actor: getUserInfo(userMap, activity.actorId ?? ""),
      })),
    };

    const userMapObj = Object.fromEntries(userMap);

    return NextResponse.json({ hub, userMap: userMapObj });
  } catch (error) {
    console.error("Error getting hub:", error);

    return NextResponse.json({ error: "Failed to get hub" }, { status: 500 });
  }
}
