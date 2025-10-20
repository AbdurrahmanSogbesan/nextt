import { createUserMap } from "@/lib/clerk-utils";
import prisma from "@/lib/prisma";
import { getUserInfo } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { updateRosterMemberRoleSchema } from "@/lib/schemas";
import { z } from "zod";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const dbRoster = await prisma.roster.findUnique({
      where: { id: parseInt(id) },
      include: { members: { where: { isDeleted: { equals: false } } } },
    });

    if (!dbRoster) {
      return NextResponse.json({ error: "Roster not found" }, { status: 404 });
    }

    const uniqueIds = new Set(dbRoster?.members.map((m) => m.rosterUserId));

    const userMap = await createUserMap(Array.from(uniqueIds));

    const members = (dbRoster?.members ?? []).map((m) => ({
      ...m,
      user: getUserInfo(userMap, m.rosterUserId),
    }));

    return NextResponse.json({
      members,
      roster: dbRoster,
    });
  } catch (error) {
    console.error("Error fetching roster members:", error);
    return NextResponse.json(
      { error: "Failed to fetch roster members" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { rosterUserId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const rosterId = parseInt(id);

    const roster = await prisma.roster.findUnique({
      where: { id: rosterId },
      include: { members: true },
    });

    if (!roster) {
      return NextResponse.json({ error: "Roster not found" }, { status: 404 });
    }

    const existingActiveMember = roster.members.find(
      (m) => m.rosterUserId === rosterUserId && !m.isDeleted
    );

    if (existingActiveMember) {
      return NextResponse.json(
        { error: "User is already a member of this roster" },
        { status: 400 }
      );
    }

    // Calculate new position based on active members only
    const newMemberPosition =
      roster.members.filter((m) => !m.isDeleted).length + 1;

    const member = await prisma.rosterMembership.upsert({
      where: {
        rosterId_rosterUserId: {
          rosterId,
          rosterUserId,
        },
      },
      update: {
        isDeleted: false,
        position: newMemberPosition,
      },
      create: {
        position: newMemberPosition,
        roster: { connect: { id: rosterId } },
        rosterUserId,
      },
    });

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Error adding member to roster:", error);
    return NextResponse.json(
      { error: "Failed to add member to roster" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { rosterUserId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const rosterId = parseInt(id);

    // check if the roster exists
    const roster = await prisma.roster.findUnique({
      where: { id: rosterId, isDeleted: false },
    });

    if (!roster) {
      return NextResponse.json({ error: "Roster not found" }, { status: 404 });
    }

    // Check if the requesting user is an admin
    const isAdmin = await prisma.rosterMembership.findFirst({
      where: {
        rosterId,
        rosterUserId: userId,
        isAdmin: true,
        isDeleted: false,
      },
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only admins can remove roster members" },
        { status: 403 }
      );
    }

    // Find the member to delete
    const memberToDelete = await prisma.rosterMembership.findUnique({
      where: {
        rosterId_rosterUserId: {
          rosterId,
          rosterUserId,
        },
      },
    });

    if (!memberToDelete) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (memberToDelete.isDeleted) {
      return NextResponse.json(
        { error: "Member is already deleted" },
        { status: 400 }
      );
    }

    const deletedMemberPosition = memberToDelete.position;

    // Mark the member as deleted
    const deletedMember = await prisma.rosterMembership.update({
      where: {
        rosterId_rosterUserId: {
          rosterId,
          rosterUserId,
        },
      },
      data: {
        isDeleted: { set: true },
      },
    });

    // Decrement positions for all members with position > deleted member's position
    await prisma.rosterMembership.updateMany({
      where: {
        rosterId,
        position: { gt: deletedMemberPosition },
        isDeleted: false,
      },
      data: { position: { decrement: 1 } },
    });

    return NextResponse.json({ member: deletedMember });
  } catch (error) {
    console.error("Error removing member from roster:", error);
    return NextResponse.json(
      { error: "Failed to remove member from roster" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const validatedData = updateRosterMemberRoleSchema.parse(body);

    const rosterId = parseInt(id);

    // First, verify the roster exists
    const roster = await prisma.roster.findUnique({
      where: { id: rosterId },
      include: {
        members: {
          where: {
            rosterUserId: { equals: userId },
            isDeleted: { equals: false },
          },
        },
      },
    });

    if (!roster) {
      return NextResponse.json({ error: "Roster not found" }, { status: 404 });
    }

    // Check if the requesting user is an admin of this roster
    const requestingUserMembership = roster.members.find(
      (m) => m.rosterUserId === userId
    );
    if (!requestingUserMembership || !requestingUserMembership.isAdmin) {
      return NextResponse.json(
        {
          error: "Only roster admins can update member admin status",
        },
        { status: 403 }
      );
    }

    // Check if the target member exists in the roster
    const targetMember = await prisma.rosterMembership.findUnique({
      where: {
        rosterId_rosterUserId: {
          rosterId: roster.id,
          rosterUserId: validatedData.rosterUserId,
        },
      },
    });

    if (!targetMember || targetMember.isDeleted) {
      return NextResponse.json(
        {
          error: "Member not found in this roster",
        },
        { status: 404 }
      );
    }

    // Prevent removing admin status from the last admin
    if (!validatedData.isAdmin) {
      const adminCount = await prisma.rosterMembership.count({
        where: {
          rosterId: roster.id,
          isAdmin: true,
          isDeleted: false,
        },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          {
            error: "Cannot remove admin status from the last admin",
          },
          { status: 400 }
        );
      }
    }

    // Update the admin status
    const updatedMembership = await prisma.rosterMembership.update({
      where: {
        rosterId_rosterUserId: {
          rosterId: roster.id,
          rosterUserId: validatedData.rosterUserId,
        },
      },
      data: {
        isAdmin: validatedData.isAdmin,
      },
    });

    return NextResponse.json({
      membership: updatedMembership,
    });
  } catch (error) {
    console.error("Error updating admin status:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update admin status" },
      { status: 500 }
    );
  }
}
