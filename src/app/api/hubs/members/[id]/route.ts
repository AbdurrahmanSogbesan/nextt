import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { updateHubMemberRoleSchema } from "@/lib/schemas";
import { createUserMap } from "@/lib/clerk-utils";
import { getUserInfo } from "@/lib/utils";

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
