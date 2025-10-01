import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export default async function AuthCallbackPage() {
  const { userId } = await auth();
  if (!userId) return redirect("/sign-in");

  // 1. Check if user is in lastVisitedUsers
  const hubWithVisit = await prisma.hub.findFirst({
    where: {
      lastVisitedUsers: {
        has: userId,
      },
    },
  });

  if (hubWithVisit) {
    return redirect(`/hubs/${hubWithVisit.id}`);
  }

  // 2. Otherwise, get first hub user is member of
  const firstHub = await prisma.hub.findFirst({
    where: {
      members: {
        some: { hubUserid: userId },
      },
    },
  });

  if (firstHub) {
    return redirect(`/hubs/${firstHub.id}`);
  }

  // 3. Otherwise, fallback to create
  return redirect("/hubs/create");
}
