import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.hubMembership.findMany({
      where: { hubUserid: userId, isDeleted: false, hub: { isDeleted: false } },
      include: { hub: true },
      orderBy: { dateJoined: "desc" },
    });

    const hubs = memberships.map((m) => ({
      id: m.hub.id,
      name: m.hub.name,
      logo: m.hub.logo,
      theme: m.hub.theme,
      visibility: m.hub.visibility,
      members: undefined, // keep payload light
    }));

    return NextResponse.json({ hubs });
  } catch (error) {
    console.error("Error getting my hubs:", error);
    return NextResponse.json(
      { error: "Failed to get my hubs" },
      { status: 500 }
    );
  }
}
