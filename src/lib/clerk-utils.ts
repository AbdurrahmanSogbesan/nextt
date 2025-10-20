import { clerkClient } from "@clerk/nextjs/server";
import { MemberUserDetails } from "@/types";
import { Prisma } from "@prisma/client";
import prisma from "./prisma";
// note: server only

/**
 * Fetches user data from Clerk and creates a user map
 */
export async function createUserMap(
  userIds: string[]
): Promise<Map<string, MemberUserDetails>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const client = await clerkClient();
  const { data: usersData } = await client.users.getUserList({
    userId: userIds,
  });

  return new Map(
    usersData.map((user) => [
      user.id,
      {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.emailAddresses[0]?.emailAddress || "",
        avatarUrl: user.imageUrl,
      },
    ])
  );
}

export async function getUserDetails(
  userId: string
): Promise<MemberUserDetails & { fullName: string }> {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  return {
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.emailAddresses[0]?.emailAddress || "",
    avatarUrl: user.imageUrl,
    fullName: user.fullName || "",
  };
}

export type RosterWithMembers = Prisma.RosterGetPayload<{
  include: {
    members: true;
    rotationOption: true;
  };
}>;

export async function getNextMemberships(
  roster: RosterWithMembers,
  currentPosition: number
) {
  const memberCount = roster.members.length;

  // Calculate next position with wrap-around (1-indexed)
  const nextPosition = currentPosition >= memberCount ? 1 : currentPosition + 1;

  // Calculate future position with wrap-around (1-indexed)
  const futurePosition = nextPosition >= memberCount ? 1 : nextPosition + 1;

  // Get both members in a single query
  const members = await prisma.rosterMembership.findMany({
    where: {
      rosterId: roster.id,
      isDeleted: false,
      position: {
        in: [nextPosition, futurePosition],
      },
    },
  });

  const nextMember = members.find((m) => m.position === nextPosition);
  const futureMember = members.find((m) => m.position === futurePosition);

  if (!nextMember || !futureMember) {
    throw new Error("Could not find next members");
  }

  return {
    nextMember,
    futureMember,
  };
}
