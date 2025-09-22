import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { createRosterSchema } from "@/lib/schemas";


export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = createRosterSchema.parse(body);

    const hub = await prisma.hub.findUnique({
      where: { id: validated.hubId },
      select: { id: true },
    });
    if (!hub) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    let membersToCreate:
      | Array<{ rosterUserId: string; position: number; isAdmin: boolean }>
      | undefined;

    if (validated.inlcudeAllHubMembers) {
      const hubMembers = await prisma.hubMembership.findMany({
        where: { hubId: validated.hubId, isDeleted: false },
        orderBy: { dateJoined: "asc" },
        select: { hubUserid: true },
      });

      // Unique user IDs, creator first (admin), then others
      const uniqueIds = Array.from(
        new Set<string>([userId, ...hubMembers.map((m) => m.hubUserid)])
      );

      membersToCreate = uniqueIds.map((uid, idx) => ({
        rosterUserId: uid,
        position: idx + 1,
        isAdmin: uid === userId, // creator is admin
      }));
    } else {
      // Only the creator as the first/only member and admin
      membersToCreate = [
        { rosterUserId: userId, position: 1, isAdmin: true },
      ];
    }

    const roster = await prisma.roster.create({
      data: {
        name: validated.name,
        description: validated.description,
        start: validated.start,
        end: validated.end,
        enablePushNotifications: validated.enablePushNotifications,
        emailNotificationIsEnabled: validated.emailNotificationIsEnabled,
        isPrivate: validated.isPrivate,
        rotationType: validated.rotationChoice ?? null,
        hub: { connect: { id: validated.hubId } },
        createdById: userId,
        members: {
          create: membersToCreate,
        },
      },
      select: { uuid: true },
    });

    return NextResponse.json({ id: roster.uuid });
  } catch (error) {
    console.error("Error creating roster:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create roster" },
      { status: 500 }
    );
  }
}

