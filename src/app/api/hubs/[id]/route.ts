import prisma from "@/lib/prisma";
import { createUserMap } from "@/lib/clerk-utils";
import { getUserInfo } from "@/lib/utils";
import { auth, currentUser, User } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { VISIBILITY_CHOICE } from "@prisma/client";
import { z } from "zod";
import { PrismaHub } from "../../../../types/hub";
import { createHubSchema } from "@/lib/schemas";

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

    // Access control: Only allow active members to access private hubs
    if (dbhub.visibility === VISIBILITY_CHOICE.PRIVATE) {
      const isActiveMember = dbhub.members.some(
        (member) => member.hubUserid === userId
      );
      if (!isActiveMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
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

async function getMeAndRole(hubId: string, me: User | null) {
  const userId = me?.id || null;
  const hub: Partial<PrismaHub> | null = await prisma.hub.findUnique({
    where: { id: Number(hubId), isDeleted: false },
    include: { members: { where: { hubUserid: userId! } } },
  });

  if (!hub) return { me, hub: null, role: null };
  const role = hub.members![0]?.isAdmin ? "ADMIN" : "MEMBER";
  return { me, hub, role };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    const { id } = await params;
    const userId = user?.id || null;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { me, role } = await getMeAndRole(id, user);
    if (!me) return new NextResponse("Onboarding required", { status: 400 });

    if (role !== "ADMIN") return new NextResponse("Forbidden", { status: 403 });

    const json = await req.json();
    const body = createHubSchema.parse(json);

    const updated = await prisma.hub.update({
      where: { id: Number(id), isDeleted: false },
      data: {
        name: body.name,
        description: body.description ?? null,
        logo: body.logoUrl ?? null,
        theme: body.theme,
        visibility: body.visibility,
      },
    });

    return NextResponse.json({ id: updated.id });
  } catch (error) {
    console.error("Error updating hub:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: z.flattenError(error) },
        { status: 400 }
      );
    }
    console.error("Error updating hub:", error);
    return NextResponse.json(
      { error: "Failed to update hub" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await currentUser();
    const { id } = await params;
    const userId = user?.id || null;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const hub = await prisma.hub.findUnique({
      where: { id: Number(id), isDeleted: false },
    });
    if (!hub) return new NextResponse("Not found", { status: 404 });

    const hubMemberships = await prisma.hubMembership.findMany({
      where: { hubUserid: userId, isDeleted: false },
    });

    // if user is only in one hub, dont allow deletion
    if (hubMemberships.length === 1) {
      return new NextResponse("You cannot delete your only hub", {
        status: 403,
      });
    }

    if (hub.ownerId !== userId)
      return new NextResponse("Only the owner can delete", { status: 403 });

    await prisma.$transaction(async (tx) => {
      const hubId = Number(id);
      await tx.hubMembership.updateMany({
        where: { hubId },
        data: { isDeleted: true },
      });
      await tx.rosterMembership?.updateMany({
        where: { roster: { hubId } },
        data: { isDeleted: true },
      });
      await tx.roster?.updateMany({
        where: { hubId },
        data: { isDeleted: true },
      });
      await tx.activity?.updateMany({
        where: { hubId },
        data: { isDeleted: true },
      });
      await tx.hub.update({ where: { id: hubId }, data: { isDeleted: true } });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting hub:", error);
    return NextResponse.json(
      { error: "Failed to delete hub" },
      { status: 500 }
    );
  }
}
