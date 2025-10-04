import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { patchRosterSchema } from "@/lib/schemas";
import { ROTATION_CHOICE } from "@prisma/client";
import { getNextDate } from "@/lib/utils";
import { z } from "zod";
import { createUserMap } from "@/lib/clerk-utils";
import { getCurrentPeriod } from "@/lib/utils";
import { MemberUserDetails } from "@/types";
import type {
  GetRosterResponse,
  ActivityItem,
  CommentItem,
  MemberWithProfile,
  Rotation,
  TurnWithUser,
} from "@/types/roster";

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
    const { userId } = await auth(); // viewer may be null
    const { id } = await context.params;
    const now = new Date();

    // 1) Load roster base (members, activities, comments)
    const roster = await prisma.roster.findUnique({
      where: { id: Number(id) },
      select: {
        id: true,
        uuid: true,
        name: true,
        description: true,
        isPrivate: true,
        enablePushNotifications: true,
        enableEmailNotifications: true,
        start: true,
        end: true,
        rotationType: true,
        hubId: true,
        createdById: true,
        currentTurnId: true,
        nextTurnId: true,
        nextDate: true,
        status: true,
        isDeleted: true,
        rotationOption: true,
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
      },
    });

    if (!roster || roster.isDeleted) {
      return NextResponse.json({ error: "Roster not found" }, { status: 404 });
    }

    // 2) First 5 upcoming turns by dueDate (>= now)
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

    const currentTurn = upcomingTurns[0] ?? null;
    const nextTurn = upcomingTurns[1] ?? null;

    // 3) Is viewer scheduled in this period?
    const { start: periodStart, end: periodEnd, kind } = getCurrentPeriod(
      (roster.rotationType as Rotation) ?? "DAILY",
      now
    );

    const isScheduledThisPeriod = userId
      ? !!(await prisma.turn.findFirst({
          where: {
            rosterId: roster.id,
            isDeleted: false,
            rosterMembershipRosterUserId: userId,
            dueDate: { gte: periodStart, lte: periodEnd },
          },
          select: { id: true },
        }))
      : false;

    // 4) Build Clerk user map (members + upcoming turn assignees + activity actors + comment users)
    const ids = new Set<string>();
    roster.members.forEach((m) => ids.add(m.rosterUserId));
    upcomingTurns.forEach((t) => t.rosterMembershipRosterUserId && ids.add(t.rosterMembershipRosterUserId));
    roster.activities.forEach((a) => a.actorId && ids.add(a.actorId));
    roster.comments.forEach((c) => c.userId && ids.add(c.userId));
    const userMap = await createUserMap(Array.from(ids)); // Map<string, MemberUserDetails>

    const profileOf = (uid?: string | null): MemberUserDetails | null => {
      if (!uid) return null;
      return userMap.get(uid) ?? null;
    };

    const toTurnWithUser = (t: (typeof upcomingTurns)[number]): TurnWithUser => {
      const p = profileOf(t.rosterMembershipRosterUserId);
      const name = p ? `${p.firstName} ${p.lastName}`.trim() || p.email : t.rosterMembershipRosterUserId;
      return {
        turnUuid: t.uuid,
        status: t.status,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        user: {
          userId: t.rosterMembershipRosterUserId ?? null,
          name: name ?? null,
          avatarUrl: p?.avatarUrl ?? null,
        },
      };
    };

    const activities: ActivityItem[] = roster.activities.map((a) => ({
      id: a.id,
      title: a.title,
      createdAt: a.createdAt.toISOString(),
      meta: a.meta ?? undefined,
      actorId: a.actorId ?? null,
      body: a.body ?? null,
      hubId: a.hubId ?? null,
      rosterId: a.rosterId ?? null,
      isDeleted: a.isDeleted,
      actor: profileOf(a.actorId),
    }));

    const comments: CommentItem[] = roster.comments.map((c) => ({
      id: c.id,
      uuid: c.uuid,
      userId: c.userId ?? null,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      rosterId: c.rosterId ?? null,
      isDeleted: c.isDeleted,
      profile: profileOf(c.userId),
    }));

    // 5) Build final response
    const resp: GetRosterResponse = {
      viewer: {
        userId: userId ?? null,
        isScheduledThisPeriod,
        period: {
          start: periodStart.toISOString(),
          end: periodEnd.toISOString(),
          kind: (roster.rotationType as Rotation) ?? kind,
        },
      },
      scheduleNow: currentTurn ? toTurnWithUser(currentTurn) : null,
      scheduleNext: nextTurn ? toTurnWithUser(nextTurn) : null,
      members: roster.members.map<MemberWithProfile>((m) => {
        const p = profileOf(m.rosterUserId) ?? {
          firstName: "",
          lastName: "",
          email: m.rosterUserId,
          avatarUrl: null,
        };
        return {
          userId: m.rosterUserId,
          position: m.position,
          isAdmin: m.isAdmin,
          dateJoined: m.dateJoined.toISOString(),
          profile: p,
        };
      }),
      nextTurns: upcomingTurns.map(toTurnWithUser),
      activities,
      comments,
      roster: {
        uuid: roster.uuid,
        name: roster.name,
        description: roster.description,
        isPrivate: roster.isPrivate,
        enablePushNotifications: roster.enablePushNotifications,
        enableEmailNotifications: roster.enableEmailNotifications,
        start: roster.start.toISOString(),
        end: roster.end.toISOString(),
        rotationType: roster.rotationType as Rotation,
        hubId: roster.hubId,
        createdById: roster.createdById,
        currentTurnId: roster.currentTurnId,
        nextTurnId: roster.nextTurnId,
        nextDate: roster.nextDate ? roster.nextDate.toISOString() : null,
        status: roster.status,
        rotationOption: roster.rotationOption,
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
