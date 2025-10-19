import { createUserMap } from "@/lib/clerk-utils";
import prisma from "@/lib/prisma";
import { getUserInfo } from "@/lib/utils";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

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

    const isMember = roster?.members.some(
      (m) => m.rosterUserId === rosterUserId
    );

    if (isMember) {
      return NextResponse.json(
        { error: "User is already a member of this roster" },
        { status: 400 }
      );
    }

    const newMemberPosition =
      roster.members.length > 0 ? roster.members.length + 1 : 1;

    const member = await prisma.rosterMembership.create({
      data: {
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
