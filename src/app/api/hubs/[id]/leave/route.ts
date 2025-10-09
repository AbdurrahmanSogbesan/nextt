import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const hubId = parseInt(id);

    const hub = await prisma.hub.findUnique({
      where: { id: hubId },
      include: { members: true },
    });

    if (!hub || hub.isDeleted) {
      return NextResponse.json({ error: "Hub not found" }, { status: 404 });
    }

    const membership = hub.members.find(
      (m) => m.hubUserid === userId && !m.isDeleted
    );
    if (!membership) {
      return NextResponse.json(
        { error: "Membership not found" },
        { status: 404 }
      );
    }

    // prevent leaving if this is the user's only active hub membership
    const activeHubCount = await prisma.hubMembership.count({
      where: { hubUserid: userId, isDeleted: false },
    });
    if (activeHubCount <= 1) {
      return NextResponse.json(
        { error: "Cannot leave your only hub" },
        { status: 400 }
      );
    }

    // owner trying to leave -> attempt transfer to next-oldest member
    if (hub.ownerId && hub.ownerId === userId) {
      // prefer admin candidates first
      const adminCandidates = hub.members
        .filter((m) => m.hubUserid !== userId && !m.isDeleted && m.isAdmin)
        .sort((a, b) => a.dateJoined.getTime() - b.dateJoined.getTime());

      const nonAdminCandidates = hub.members
        .filter((m) => m.hubUserid !== userId && !m.isDeleted && !m.isAdmin)
        .sort((a, b) => a.dateJoined.getTime() - b.dateJoined.getTime());

      const candidates = adminCandidates.length > 0 ? adminCandidates : nonAdminCandidates;

      if (candidates.length === 0) {
        return NextResponse.json(
          { error: "You’re the only member left, so the hub owner can’t leave." },
          { status: 400 }
        );
      }

      const newOwner = candidates[0];

      // perform transfer + mark leaving membership
      await prisma.$transaction([
        prisma.hub.update({
          where: { id: hubId },
          data: { ownerId: newOwner.hubUserid },
        }),
        prisma.hubMembership.update({
          where: { hubId_hubUserid: { hubId, hubUserid: userId } },
          data: { isDeleted: true, dateLeft: new Date() },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: `Ownership transferred to ${newOwner.hubUserid}.`,
        newOwner: newOwner.hubUserid,
      });
    }

    // non-owner: just mark membership as left
    await prisma.hubMembership.update({
      where: { hubId_hubUserid: { hubId, hubUserid: userId } },
      data: { isDeleted: true, dateLeft: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error leaving hub:", err);
    return NextResponse.json({ error: "Failed to leave hub" }, { status: 500 });
  }
}