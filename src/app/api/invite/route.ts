import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { STATUS_CHOICE } from "@prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // rest would have rosterId if it's a roster invite
    const { email, hubId, ...rest } = await req.json();

    // check if the email exists on clerk
    const clerk = await clerkClient();
    const users = await clerk.users.getUserList({
      emailAddress: [email],
    });

    // Can only invite users on the system
    if (!users?.data?.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hubMemberships = await prisma.hubMembership.findMany({
      where: {
        hubId: parseInt(hubId),
        hubUserid: users.data[0].id,
      },
    });

    let rosterMemberships = [];
    if (rest.rosterId) {
      rosterMemberships = await prisma.rosterMembership.findMany({
        where: {
          rosterId: parseInt(rest.rosterId),
          rosterUserId: users.data[0].id,
        },
      });
    }

    // Check if user is already a member
    const isHubMember = hubMemberships.length > 0;
    const isRosterMember = rosterMemberships.length > 0;

    // For hub invites: prevent if user is already a hub member
    if (!rest.rosterId && isHubMember) {
      return NextResponse.json(
        {
          error: "User is already a member of this hub",
        },
        { status: 400 }
      );
    }

    // For roster invites: prevent if user is already a roster member
    if (rest.rosterId && isRosterMember) {
      return NextResponse.json(
        {
          error: "User is already a member of this roster",
        },
        { status: 400 }
      );
    }

    // Check if invite already exists
    const existingInvite = await prisma.invite.findFirst({
      where: {
        recipientId: users.data[0].id,
        email,
        hubId: parseInt(hubId),
        status: STATUS_CHOICE.PENDING,
        ...(rest.rosterId && { rosterId: parseInt(rest.rosterId) }),
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: "Invite already exists" },
        { status: 400 }
      );
    }

    return await prisma.$transaction(async (tx) => {
      const invite = await tx.invite.create({
        data: {
          recipientId: users.data[0].id,
          email,
          fromId: userId,
          hub: { connect: { id: parseInt(hubId) } },
          ...(rest.rosterId && {
            roster: { connect: { id: parseInt(rest.rosterId) } },
          }),
        },
        include: { hub: true, roster: true },
      });

      const sender = await clerk.users.getUser(invite.fromId as string);

      await tx.notification.create({
        data: {
          users: [users.data[0]?.id],
          body: `${sender.firstName} invited you to join ${
            invite?.roster?.name || invite?.hub?.name
          }`,
          invite: { connect: { id: invite.id } },
          hub: { connect: { id: invite.hub?.id } },
          ...(invite.roster?.id && {
            roster: { connect: { id: invite.roster.id } },
          }),
        },
      });

      return NextResponse.json({ invite });
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
