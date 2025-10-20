import { getNextMemberships, getUserDetails } from "@/lib/clerk-utils";
import prisma from "@/lib/prisma";
import { getNextDate } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import {
  RosterMembership,
  ROTATION_CHOICE,
  STATUS_CHOICE,
  TURN_STATUS_CHOICE,
} from "@prisma/client";
import { isAfter } from "date-fns";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { turnId } = await req.json();
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!turnId) {
    return NextResponse.json({ error: "Turn ID is required" }, { status: 400 });
  }

  try {
    const turn = await prisma.turn.findFirst({
      where: {
        id: turnId,
        rosterId: parseInt(id),
      },
      include: {
        roster: {
          include: {
            members: {
              where: { isDeleted: false },
              orderBy: { position: "asc" },
            },
            rotationOption: true,
          },
        },
      },
    });

    if (!turn || !turn.roster) {
      return NextResponse.json(
        { error: "Turn or roster not found" },
        { status: 404 }
      );
    }

    // set current turn to done
    await prisma.turn.update({
      where: { id: turnId },
      data: { status: TURN_STATUS_CHOICE.DONE },
    });

    const { roster } = turn;

    const currentMembership = await prisma.rosterMembership.findUnique({
      where: {
        rosterId_rosterUserId: {
          rosterId: roster.id,
          rosterUserId: roster.currentTurnId ?? "",
        },
      },
    });

    if (!currentMembership) {
      return NextResponse.json(
        { error: "Current membership not found" },
        { status: 404 }
      );
    }

    let upcomingMembers: Record<string, RosterMembership> = {};
    try {
      upcomingMembers = await getNextMemberships(
        roster,
        currentMembership.position
      );
    } catch (error) {
      console.error("Error getting next members:", error);
      return NextResponse.json(
        { error: "Failed to determine next members" },
        { status: 400 }
      );
    }

    const { nextMember, futureMember } = upcomingMembers;

    const nextDate = getNextDate(
      roster.rotationType ?? ROTATION_CHOICE.DAILY,
      roster.rotationOption
    );

    return await prisma.$transaction(async (tx) => {
      // Check if this completion would exceed roster end date
      if (isAfter(nextDate, roster.end)) {
        await tx.roster.update({
          where: { id: roster.id },
          data: { status: STATUS_CHOICE.COMPLETE },
        });

        await tx.activity.create({
          data: {
            title: "Roster Completed!",
            body: "All turns have been completed",
            actorId: userId,
            roster: { connect: { id: roster.id } },
            hub: { connect: { id: roster.hubId } },
          },
        });

        await tx.notification.create({
          data: {
            users: roster.members.map((m) => m.rosterUserId),
            body: "Roster has been completed!",
            roster: { connect: { id: roster.id } },
          },
        });

        return NextResponse.json({
          success: true,
          status: STATUS_CHOICE.COMPLETE,
        });
      }

      //   update roster to next turn & date
      const updatedRoster = await tx.roster.update({
        where: { id: roster.id },
        data: {
          currentTurnId: nextMember.rosterUserId,
          nextTurnId: futureMember.rosterUserId,
          nextDate,
        },
      });

      // Create new turn for next member
      const newTurn = await tx.turn.create({
        data: {
          roster: { connect: { id: roster.id } },
          rosterMembership: {
            connect: {
              rosterId_rosterUserId: {
                rosterId: roster.id,
                rosterUserId: nextMember.rosterUserId,
              },
            },
          },
          dueDate: updatedRoster.nextDate,
        },
      });

      const currentMemberDetails = await getUserDetails(
        currentMembership.rosterUserId
      );

      // Send notifications to:
      // - All roster members
      await tx.notification.create({
        data: {
          users: roster.members.map((m) => m.rosterUserId),
          body: `${currentMemberDetails.firstName}'s turn is complete!`,
          roster: { connect: { id: roster.id } },
        },
      });

      // - Next person on roster (next turn)
      await tx.notification.create({
        data: {
          users: [nextMember.rosterUserId],
          body: "You are up nextt!",
          turn: { connect: { id: newTurn.id } },
          roster: { connect: { id: roster.id } },
        },
      });

      await tx.activity.create({
        data: {
          title: "Turn Completed!",
          body: `${currentMemberDetails.firstName} completed their turn`,
          actorId: currentMembership.rosterUserId,
          hub: { connect: { id: roster.hubId } },
          roster: { connect: { id: roster.id } },
        },
      });

      return NextResponse.json({
        success: true,
        turn: newTurn,
      });
    });
  } catch (error) {
    console.error("Error completing turn:", error);
    return NextResponse.json(
      { error: "Failed to complete turn" },
      { status: 500 }
    );
  }
}
