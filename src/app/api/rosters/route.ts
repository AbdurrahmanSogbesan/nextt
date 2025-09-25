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
        isAdmin: uid === userId,
      }));
    } else {
      const incoming = validated.members ?? [];

      // Enforce unique positions & userIds
      const posSet = new Set<number>();
      const idSet = new Set<string>();
      for (const m of incoming) {
        if (posSet.has(m.position)) {
          return NextResponse.json(
            { error: `Duplicate position: ${m.position}` },
            { status: 400 }
          );
        }
        if (idSet.has(m.userId)) {
          return NextResponse.json(
            { error: `Duplicate userId: ${m.userId}` },
            { status: 400 }
          );
        }
        posSet.add(m.position);
        idSet.add(m.userId);
      }

      const hubMembers = await prisma.hubMembership.findMany({
        where: { hubId: validated.hubId, isDeleted: false },
        select: { hubUserid: true },
      });
      const hubMemberSet = new Set(hubMembers.map((m) => m.hubUserid));
      const nonMembers = incoming.filter((m) => !hubMemberSet.has(m.userId));
      if (nonMembers.length > 0) {
        return NextResponse.json(
          {
            error: "Some users are not members of the hub",
            details: { userIds: nonMembers.map((m) => m.userId) },
          },
          { status: 400 }
        );
      }

      // sort by position, map to create payload, mark creator as admin
      const sorted = [...incoming].sort((a, b) => a.position - b.position);
      membersToCreate = sorted.map((m) => ({
        rosterUserId: m.userId,
        position: m.position,
        isAdmin: m.userId === userId,
      }));
    }

    // Create roster + memberships
    const roster = await prisma.roster.create({
      data: {
        name: validated.name,
        description: validated.description ?? "",
        start: validated.start,
        end: validated.end,
        enablePushNotifications: validated.enablePushNotifications,
        enableEmailNotifications: validated.enableEmailNotifications, // keep naming consistent with your model
        isPrivate: validated.isPrivate,
        rotationType: validated.rotationChoice ?? null,
        hub: { connect: { id: validated.hubId } },
        createdById: userId,
        members: { create: membersToCreate },
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
