import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, memberId } = await context.params;
    const hubId = parseInt(id);
    const targetUserId = memberId;

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
      return NextResponse.json({ error: "Requester not a hub member" }, { status: 403 });
    }
    const isRequesterAllowed = requesterMembership.isAdmin || hub.ownerId === userId;
    if (!isRequesterAllowed) {
      return NextResponse.json({ error: "Only hub admins can remove members" }, { status: 403 });
    }

    // find target membership
    const targetMembership = hub.members.find(
      (m) => m.hubUserid === targetUserId && !m.isDeleted
    );
    if (!targetMembership) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (hub.ownerId === targetUserId) {
      return NextResponse.json({ error: "Cannot remove the hub owner" }, { status: 400 });
    }

    await prisma.hubMembership.update({
      where: { hubId_hubUserid: { hubId, hubUserid: targetUserId } },
      data: { isDeleted: true, dateLeft: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error removing hub member:", err);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}