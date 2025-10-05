import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { createUserMap } from "@/lib/clerk-utils";
import type {
  GetRosterResponse,
  ActivityItem,
  CommentItem,
  MemberWithProfile,
  Rotation,
  TurnWithUser,
} from "@/types/roster";
import { patchRosterSchema } from "@/lib/schemas";
import { ROTATION_CHOICE } from "@prisma/client";
import z from "zod";
import { getNextDate } from "@/lib/utils";

function clean<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

async function assertAdmin(rosterId: number, userId: string) {
  const isAdmin = await prisma.rosterMembership.findFirst({
    where: { rosterId, rosterUserId: userId, isAdmin: true, isDeleted: false },
  });
  if (!isAdmin) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const now = new Date();

    // 1) Roster + relations
    const roster = await prisma.roster.findUnique({
      where: { id: Number(id) },
      include: {
        members: {
          where: { isDeleted: false },
          orderBy: { position: "asc" },
          select: {
            rosterUserId: true,
            position: true,
            isAdmin: true,
            dateJoined: true,
          },
        },
        activities: {
          where: { isDeleted: false },
          orderBy: { id: "desc" },
          select: {
            id: true,
            title: true,
            createdAt: true,
            meta: true,
            actorId: true,
            body: true,
            hubId: true,
            rosterId: true,
            isDeleted: true,
          },
        },
        comments: {
          where: { isDeleted: false },
          orderBy: { id: "desc" },
          select: {
            id: true,
            uuid: true,
            userId: true,
            content: true,
            createdAt: true,
            rosterId: true,
            isDeleted: true,
          },
        },
        rotationOption: {
          select: {
            rotation: true,
            unit: true,
            id: true,
            rosterId: true,
          },
        },
      },
    });

    if (!roster || roster.isDeleted) {
      return NextResponse.json({ error: "Roster not found" }, { status: 404 });
    }

    // 2) First 5 upcoming turns by dueDate
    const upcomingTurns = await prisma.turn.findMany({
      where: { rosterId: roster.id, isDeleted: false, dueDate: { gte: now } },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: {
        uuid: true,
        status: true,
        dueDate: true,
        rosterMembershipRosterUserId: true,
      },
    });

    const [currentTurn, nextTurn] = [upcomingTurns[0] ?? null, upcomingTurns[1] ?? null];

    // 3) Build Clerk user map
    const ids = Array.from(new Set(roster.members.map(m => m.rosterUserId)));
    const userMap = await createUserMap(ids);

    const nameOf = (uid?: string | null) => {
      if (!uid) return null;
      const u = userMap.get(uid);
      const full = u ? `${u.firstName} ${u.lastName}`.trim() : null;
      return full || u?.email || uid;
    };
    const avatarOf = (uid?: string | null) => (uid ? userMap.get(uid)?.avatarUrl ?? null : null);

    const toTurnWithUser = (t: (typeof upcomingTurns)[number]): TurnWithUser => ({
      turnUuid: t.uuid,
      status: t.status,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      user: {
        userId: t.rosterMembershipRosterUserId ?? null,
        name: nameOf(t.rosterMembershipRosterUserId),
        avatarUrl: avatarOf(t.rosterMembershipRosterUserId),
      },
    });

    const activities: ActivityItem[] = roster.activities.map(({ createdAt, actorId, ...rest }) => ({
      ...rest,
      createdAt: createdAt.toISOString(),
      actorId: actorId ?? null,
      actor: actorId ? userMap.get(actorId) ?? null : null,
    }));

    const comments: CommentItem[] = roster.comments.map(({ createdAt, userId, ...rest }) => ({
      ...rest,
      createdAt: createdAt.toISOString(),
      userId: userId ?? null,
      profile: userId ? userMap.get(userId) ?? null : null,
    }));

    const members = roster.members.map<MemberWithProfile>(({ dateJoined, rosterUserId, ...rest }) => ({
      ...rest,
      userId: rosterUserId,
      dateJoined: dateJoined.toISOString(),
      profile:
        userMap.get(rosterUserId) ?? {
          firstName: "",
          lastName: "",
          email: rosterUserId,
          avatarUrl: null,
        },
    }));

    // 4) Final response
    const resp: GetRosterResponse = {
      scheduleNow: currentTurn ? toTurnWithUser(currentTurn) : null,
      scheduleNext: nextTurn ? toTurnWithUser(nextTurn) : null,
      members,
      nextTurns: upcomingTurns.map(toTurnWithUser),
      activities,
      comments,
      roster: {
        ...roster,
        start: roster.start.toISOString(),
        end: roster.end.toISOString(),
        nextDate: roster.nextDate ? roster.nextDate.toISOString() : null,
        rotationType: roster.rotationType as Rotation,
      },
    };

    return NextResponse.json(resp);
  } catch (err) {
    console.error("Error fetching roster page:", err);
    return NextResponse.json({ error: "Failed to fetch roster" }, { status: 500 });
  }
}



export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = patchRosterSchema.parse(body);

    const { id } = await context.params;

    const roster = await prisma.roster.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        hubId: true,
        start: true,
        end: true,
        isDeleted: true,
        rotationType: true,
        rotationOption: {
          select: {
            rotation: true,
            unit: true,
          },
        },
      },
    });
    if (!roster || roster.isDeleted) {
      return NextResponse.json({ error: "Roster not found" }, { status: 404 });
    }

    await assertAdmin(roster.id, userId);

    const start = data.start ? new Date(data.start) : undefined;
    const end = data.end ? new Date(data.end) : undefined;
    if ((start || end) && !((end ?? roster.end) > (start ?? roster.start))) {
      return NextResponse.json(
        { error: "End must be after start" },
        { status: 400 }
      );
    }

    // Calculate nextDate if rotation type or rotation option changes
    let nextDate: Date | undefined;
    if (data.rotationType || data.rotationOption) {
      const newRotationType = data.rotationType ?? roster.rotationType;
      const newRotationOption =
        data.rotationOption ?? (roster.rotationOption || undefined);

      if (newRotationType) {
        nextDate = getNextDate(newRotationType, newRotationOption);
      }
    }

    const updatePayload = clean({
      name: data.name,
      description: data.description,
      rotationType: data.rotationType,
      start,
      end,
      enablePushNotifications: data.enablePushNotifications,
      enableEmailNotifications: data.enableEmailNotifications,
      isPrivate: data.isPrivate,
      ...(nextDate && { nextDate }),
    });

    let membersNested:
      | {
          upsert: Array<{
            where: {
              rosterId_rosterUserId: { rosterId: number; rosterUserId: string };
            };
            update: { position?: number; isAdmin?: boolean };
            create: {
              rosterUserId: string;
              position: number;
              isAdmin: boolean;
            };
          }>;
        }
      | undefined;

    if (data.members?.length) {
      const seenPos = new Set<number>();
      const seenIds = new Set<string>();
      for (const m of data.members) {
        if (seenPos.has(m.position)) {
          return NextResponse.json(
            { error: `Duplicate position: ${m.position}` },
            { status: 400 }
          );
        }
        if (seenIds.has(m.userId)) {
          return NextResponse.json(
            { error: `Duplicate userId: ${m.userId}` },
            { status: 400 }
          );
        }
        seenPos.add(m.position);
        seenIds.add(m.userId);
      }

      const sorted = [...data.members].sort((a, b) => a.position - b.position);

      membersNested = {
        upsert: sorted.map((m) => ({
          where: {
            rosterId_rosterUserId: {
              rosterId: roster.id,
              rosterUserId: m.userId,
            },
          },
          update: {
            position: m.position,
            ...(m.userId === userId && { isAdmin: true }),
          },
          create: {
            rosterUserId: m.userId,
            position: m.position,
            isAdmin: m.userId === userId,
          },
        })),
      };
    }

    const updated = await prisma.roster.update({
      where: { id: parseInt(id) },
      data: {
        ...updatePayload,
        ...(membersNested && { members: membersNested }),
      },
      select: { id: true },
    });

    // Handle custom rotation option
    if (
      (data.rotationType === ROTATION_CHOICE.CUSTOM ||
        roster.rotationType === ROTATION_CHOICE.CUSTOM) &&
      data.rotationOption
    ) {
      // create or update rotation option
      await prisma.rotationOption.upsert({
        where: { rosterId: roster.id },
        update: {
          rotation: data.rotationOption.rotation,
          unit: data.rotationOption.unit,
        },
        create: {
          roster: { connect: { id: roster.id } },
          rotation: data.rotationOption.rotation,
          unit: data.rotationOption.unit,
        },
      });
    } else if (
      data.rotationType &&
      data.rotationType !== ROTATION_CHOICE.CUSTOM
    ) {
      // If rotation type is changed to non-custom, delete existing rotation option
      await prisma.rotationOption.deleteMany({
        where: { rosterId: roster.id },
      });
    }

    return NextResponse.json({ id: updated.id });
  } catch (error) {
    console.error("Error updating roster:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: z.flattenError(error) },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update roster" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    const roster = await prisma.roster.findUnique({
      where: { id: parseInt(id) },
      select: { id: true, isDeleted: true },
    });

    if (!roster || roster.isDeleted) {
      return NextResponse.json({ error: "Roster not found" }, { status: 404 });
    }

    await assertAdmin(roster.id, userId);

    await prisma.roster.update({
      where: { id: roster.id },
      data: { isDeleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting roster:", error);

    return NextResponse.json(
      { error: "Failed to delete roster" },
      { status: 500 }
    );
  }
}
