import prisma from "@/lib/prisma";
import { updateInviteSchema } from "@/lib/schemas";
import { auth } from "@clerk/nextjs/server";
import { STATUS_CHOICE } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: inviteId } = await params;
    const body = await req.json();

    const validatedData = updateInviteSchema.parse(body);

    // 1. Fetch invite with related data
    const invite = await prisma.invite.findUnique({
      where: { id: parseInt(inviteId), isDeleted: false },
      include: { hub: true, roster: true },
    });

    // 2. Validate invite exists
    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // 3. Validate user is recipient
    if (invite.recipientId !== userId) {
      return NextResponse.json(
        { error: "You are not the recipient of this invite" },
        { status: 403 }
      );
    }

    // 4. Validate invite is pending
    if (invite.status !== STATUS_CHOICE.PENDING) {
      return NextResponse.json(
        { error: "Invite has already been processed" },
        { status: 400 }
      );
    }

    // 5. Validate hub/roster still exist
    if (!invite.hub || invite.hub.isDeleted) {
      return NextResponse.json(
        { error: "Hub no longer exists" },
        { status: 404 }
      );
    }

    if (invite.rosterId && (!invite.roster || invite.roster.isDeleted)) {
      return NextResponse.json(
        { error: "Roster no longer exists" },
        { status: 404 }
      );
    }

    // 6. Handle rejection - just update status
    if (validatedData.response === "REJECT") {
      await prisma.invite.update({
        where: { id: invite.id },
        data: { status: STATUS_CHOICE.COMPLETE },
      });

      return NextResponse.json({
        message: "REJECTED",
      });
    }

    // 7. Handle acceptance with transaction
    return await prisma.$transaction(async (tx) => {
      // Update invite status
      await tx.invite.update({
        where: { id: invite.id },
        data: { status: STATUS_CHOICE.COMPLETE },
      });

      // Add to hub (upsert to handle deleted memberships)
      await tx.hubMembership.upsert({
        where: {
          hubId_hubUserid: {
            hubId: invite.hubId as number,
            hubUserid: userId,
          },
        },
        update: {
          isDeleted: false,
          dateLeft: null,
          // Keep existing isAdmin status if restoring
        },
        create: {
          hubId: invite.hubId as number,
          hubUserid: userId,
          isAdmin: false, // Regular members are not admin by default
        },
      });

      // If roster invite, add to roster
      if (invite.rosterId) {
        const roster = await tx.roster.findUnique({
          where: { id: invite.rosterId },
          include: { members: { where: { isDeleted: false } } },
        });

        if (roster) {
          const newPosition = roster.members.length + 1;

          await tx.rosterMembership.upsert({
            where: {
              rosterId_rosterUserId: {
                rosterId: invite.rosterId,
                rosterUserId: userId,
              },
            },
            update: {
              isDeleted: false,
              position: newPosition,
            },
            create: {
              rosterId: invite.rosterId,
              rosterUserId: userId,
              position: newPosition,
              isAdmin: false,
            },
          });

          // Create notification for roster join
          await tx.notification.create({
            data: {
              users: [userId],
              body: `You joined ${roster.name}`,
              rosterId: roster.id,
              hubId: invite.hubId!,
            },
          });
        }
      } else {
        // Hub-only invite - create notification
        await tx.notification.create({
          data: {
            users: [userId],
            body: `You joined ${invite.hub?.name}`,
            hubId: invite.hubId!,
          },
        });
      }

      return NextResponse.json({
        message: "ACCEPTED",
        hubId: invite.hubId,
        rosterId: invite.rosterId,
      });
    });
  } catch (error) {
    console.error("Error processing invite:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process invite" },
      { status: 500 }
    );
  }
}
