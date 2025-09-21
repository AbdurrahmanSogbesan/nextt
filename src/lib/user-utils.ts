import { clerkClient } from "@clerk/nextjs/server";
import { MemberUserDetails } from "@/types";

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

/**
 * Gets user info from the user map or returns a fallback
 */
export function getUserInfo(
  userMap: Map<string, MemberUserDetails>,
  userId: string
): MemberUserDetails {
  return (
    userMap.get(userId) || {
      firstName: "Unknown",
      lastName: "User",
      email: "",
      avatarUrl: "",
    }
  );
}
