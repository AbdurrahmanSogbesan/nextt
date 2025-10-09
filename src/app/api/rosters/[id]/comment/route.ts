import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { createUserMap } from "@/lib/clerk-utils";
import z from "zod";

const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = createCommentSchema.parse(body);

    const { id } = await context.params;
    const rosterId = parseInt(id);

    // ensure roster exists
    const roster = await prisma.roster.findUnique({
      where: { id: rosterId },
      include: { members: true },
    });

    if (!roster || roster.isDeleted) {
      return NextResponse.json({ error: "Roster not found" }, { status: 404 });
    }

    const membership = await prisma.rosterMembership.findUnique({
      where: { rosterId_rosterUserId: { rosterId, rosterUserId: userId } },
    });
    if (!membership || membership.isDeleted) {
      return NextResponse.json(
        { error: "You must be a roster member to comment" },
        { status: 403 }
      );
    }

    const created = await prisma.comment.create({
      data: {
        userId,
        content: data.content,
        roster: { connect: { id: rosterId } },
      },
      include: {
        roster: true,
      },
    });

    const userMap = await createUserMap([userId]);
    const profile = userMap.get(userId) ?? null;

    return NextResponse.json({
      comment: {
        id: created.id,
        uuid: created.uuid,
        userId: created.userId ?? null,
        content: created.content,
        createdAt: created.createdAt.toISOString(),
        rosterId: created.rosterId ?? null,
        isDeleted: created.isDeleted,
        profile,
      },
    });
  } catch (err) {
    console.error("Error creating comment:", err);
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: err.flatten() },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}