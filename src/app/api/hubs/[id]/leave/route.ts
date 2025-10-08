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

    // owner trying to leave -> attempt transfer to next-oldest member
    if (hub.ownerId && hub.ownerId === userId) {
      const candidates = hub.members
        .filter((m) => m.hubUserid !== userId && !m.isDeleted)
        .sort((a, b) => a.dateJoined.getTime() - b.dateJoined.getTime());

      if (candidates.length === 0) {
        return NextResponse.json(
          { error: "Hub owner cannot leave without transferring ownership — am oga mi" },
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
        message: `Ownership transferred to ${newOwner.hubUserid}. am oga mi`,
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