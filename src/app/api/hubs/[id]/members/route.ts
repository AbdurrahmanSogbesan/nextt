import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { createUserMap } from "@/lib/clerk-utils";
import { getUserInfo } from "@/lib/utils";
import { z } from "zod";
import { updateHubMemberRoleSchema } from "@/lib/schemas";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const hubId = parseInt(id);
    const { hubUserId } = await req.json();

    // load hub with memberships
    const hub = await prisma.hub.findUnique({
      where: { id: hubId },
      include: { members: true },
    });

    if (!hub || hub.isDeleted) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    // ensure requester is an admin of the hub or owner
    const requesterMembership = hub.members.find(
      (m) => m.hubUserid === userId && !m.isDeleted
    );
    if (!requesterMembership) {
      return NextResponse.json(
        { error: "Requester not a hub member" },
        { status: 403 }
      );
    }
    const isRequesterAllowed =
      requesterMembership.isAdmin || hub.ownerId === userId;
    if (!isRequesterAllowed) {
      return NextResponse.json(
        { error: "Only hub admins can remove members" },
        { status: 403 }
      );
    }

    // find target membership
    const targetMembership = hub.members.find(
      (m) => m.hubUserid === hubUserId && !m.isDeleted
    );
    if (!targetMembership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (hub.ownerId === hubUserId) {
      return NextResponse.json(
        { error: "Cannot remove the hub owner" },
        { status: 400 }
      );
    }

    // todo: handle removing of user from rosters and the logic for if deleted user was current or next in roster.
    const deletedMember = await prisma.hubMembership.update({
      where: { hubId_hubUserid: { hubId, hubUserid: hubUserId } },
      data: { isDeleted: true, dateLeft: new Date() },
    });

    return NextResponse.json({ member: deletedMember });
  } catch (err) {
    console.error("Error removing hub member:", err);
    return NextResponse.json(
      { error: "Failed to remove member" },
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
    const validatedData = updateHubMemberRoleSchema.parse(body);

    // First, verify the hub exists
    const hub = await prisma.hub.findUnique({
      where: { id: parseInt(id) },
      include: {
        members: {
          where: {
            hubUserid: { equals: userId },
            isDeleted: { equals: false },
          },
        },
      },
    });

    if (!hub) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    // Check if the requesting user is an admin of this hub
    const requestingUserMembership = hub.members.find(
      (m) => m.hubUserid === userId
    );
    if (!requestingUserMembership || !requestingUserMembership.isAdmin) {
      return NextResponse.json(
        {
          error: "Only hub admins can update member admin status",
        },
        { status: 403 }
      );
    }

    // Check if the target member exists in the hub
    const targetMember = await prisma.hubMembership.findUnique({
      where: {
        hubId_hubUserid: {
          hubId: hub.id,
          hubUserid: validatedData.memberUserId,
        },
      },
    });

    if (!targetMember || targetMember.isDeleted) {
      return NextResponse.json(
        {
          error: "Member not found in this hub",
        },
        { status: 404 }
      );
    }

    // Prevent removing admin status from the last admin
    if (!validatedData.isAdmin) {
      const adminCount = await prisma.hubMembership.count({
        where: {
          hubId: hub.id,
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
    const updatedMembership = await prisma.hubMembership.update({
      where: {
        hubId_hubUserid: {
          hubId: hub.id,
          hubUserid: validatedData.memberUserId,
        },
      },
      data: {
        isAdmin: validatedData.isAdmin,
      },
    });

    return NextResponse.json({
      membership: {
        hubUserid: updatedMembership.hubUserid,
        isAdmin: updatedMembership.isAdmin,
        dateJoined: updatedMembership.dateJoined,
      },
    });
  } catch (error) {
    console.error("Error updating admin status:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: z.flattenError(error) },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update admin status" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const dbhub = await prisma.hub.findUnique({
      where: { id: parseInt(id) },
      include: { members: { where: { isDeleted: { equals: false } } } },
    });

    if (!dbhub) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    const uniqueIds = new Set(dbhub?.members.map((m) => m.hubUserid));

    const userMap = await createUserMap(Array.from(uniqueIds));

    const members = (dbhub?.members ?? []).map((m) => ({
      ...m,
      user: getUserInfo(userMap, m.hubUserid),
    }));

    return NextResponse.json({
      members,
      hub: dbhub,
    });
  } catch (error) {
    console.error("Error fetching hub members:", error);
    return NextResponse.json(
      { error: "Failed to fetch hub members" },
      { status: 500 }
    );
  }
}
