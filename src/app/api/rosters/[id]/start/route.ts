import { getUserDetails } from "@/lib/clerk-utils";
import prisma from "@/lib/prisma";
import { getNextDate } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { ROTATION_CHOICE, STATUS_CHOICE } from "@prisma/client";
import { isAfter } from "date-fns";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const roster = await prisma.roster.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        rotationType: true,
        rotationOption: true,
        nextDate: true,
        end: true,
        status: true,
        members: {
          where: { isDeleted: false },
          orderBy: { position: "asc" },
        },
      },
    });

    if (!roster) {
      return NextResponse.json({ error: "Roster not found" }, { status: 404 });
    }

    if (roster.status === STATUS_CHOICE.ONGOING) {
      return NextResponse.json(
        { error: "Roster is already started" },
        { status: 400 }
      );
    }

    if (roster.status === STATUS_CHOICE.COMPLETE) {
      return NextResponse.json(
        { error: "Cannot start a completed roster" },
        { status: 400 }
      );
    }

    if (!roster.members || roster.members.length < 2) {
      return NextResponse.json(
        { error: "Not enough members found" },
        { status: 404 }
      );
    }

    const [firstMember, secondMember] = roster.members;

    const nextDate = getNextDate(
      roster.rotationType ?? ROTATION_CHOICE.DAILY,
      roster.rotationOption
    );

    const firstMemberDetails = await getUserDetails(firstMember.rosterUserId);

    if (isAfter(nextDate, roster.end)) {
      return NextResponse.json(
        { error: "Next turn date exceeds roster end date" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // Create turn for first member
      const turn = await tx.turn.create({
        data: {
          roster: { connect: { id: roster.id } },
          rosterMembership: {
            connect: {
              rosterId_rosterUserId: {
                rosterId: roster.id,
                rosterUserId: firstMember.rosterUserId,
              },
            },
          },
          dueDate: nextDate,
        },
      });

      await tx.roster.update({
        where: { id: roster.id },
        data: {
          currentTurnId: firstMember.rosterUserId,
          nextTurnId: secondMember.rosterUserId,
          nextDate,
          status: STATUS_CHOICE.ONGOING,
        },
      });

      await tx.activity.create({
        data: {
          title: "Roster Started",
          actorId: userId,
          roster: { connect: { id: roster.id } },
          body: `Roster has been started with ${firstMemberDetails.fullName} as first turn`,
        },
      });

      await tx.notification.create({
        data: {
          users: [firstMember.rosterUserId],
          body: "Your turn has started",
          roster: { connect: { id: roster.id } },
          turn: { connect: { id: turn.id } },
        },
      });

      // Notify all members that roster has started
      await tx.notification.create({
        data: {
          users: roster.members.map((m) => m.rosterUserId),
          body: "Roster has started",
          roster: { connect: { id: roster.id } },
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error starting roster:", error);
    return NextResponse.json(
      { error: "Failed to start roster" },
      { status: 500 }
    );
  }
}
