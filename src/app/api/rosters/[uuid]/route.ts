import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { patchRosterSchema } from "@/lib/schemas";
import { ROTATION_CHOICE } from "@prisma/client";
import { getNextDate } from "@/lib/utils";
import { z } from "zod";

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

export async function PATCH(
  req: Request,
  context: { params: Promise<{ uuid: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const data = patchRosterSchema.parse(body);

    const { uuid } = await context.params;

    const roster = await prisma.roster.findUnique({
      where: { uuid },
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
      where: { uuid },
      data: {
        ...updatePayload,
        ...(membersNested && { members: membersNested }),
      },
      select: { uuid: true, id: true },
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

    return NextResponse.json({ id: updated.uuid });
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
  context: { params: Promise<{ uuid: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { uuid } = await context.params;
    const roster = await prisma.roster.findUnique({
      where: { uuid: uuid },
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
