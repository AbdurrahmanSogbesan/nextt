import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { patchRosterSchema } from "@/lib/schemas";
import z from "zod";


async function assertAdmin(rosterId: number, userId: string) {
  const membership = await prisma.rosterMembership.findFirst({
    where: {
      rosterId,
      rosterUserId: userId,
      isAdmin: true,
      isDeleted: false,
    },
    select: { rosterId: true },
  });
  if (!membership) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ uuid: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = patchRosterSchema.parse(body);

    const { uuid } = await context.params; 

    const roster = await prisma.roster.findUnique({
      where: { uuid: uuid },
      select: { id: true, start: true, end: true, isDeleted: true },
    });

    if (!roster || roster.isDeleted) {
      return NextResponse.json({ error: "Roster not found" }, { status: 404 });
    }

    await assertAdmin(roster.id, userId);

    // Validate start/end if either is provided
    const newStart = data.start ?? roster.start;
    const newEnd = data.end ?? roster.end;
    if (data.start || data.end) {
      if (!(newEnd > newStart)) {
        return NextResponse.json(
          { error: "Invalid request data", details: { end: ["End must be after start"] } },
          { status: 400 }
        );
      }
    }

    const updatePayload = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.rotationChoice !== undefined && { rotationType: data.rotationChoice }),
      ...(data.start !== undefined && { start: data.start }),
      ...(data.end !== undefined && { end: data.end }),
      ...(data.enablePushNotifications !== undefined && {
        enablePushNotifications: data.enablePushNotifications,
      }),
      ...(data.emailNotificationIsEnabled !== undefined && {
        emailNotificationIsEnabled: data.emailNotificationIsEnabled,
      }),
      ...(data.isPrivate !== undefined && { isPrivate: data.isPrivate }),
    };

    const updated = await prisma.roster.update({
      where: { uuid: uuid },
      data: updatePayload,
      select: { uuid: true },
    });

    return NextResponse.json({ id: updated.uuid });
  } catch (error) {
    console.error("Error updating roster:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.flatten() },
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
