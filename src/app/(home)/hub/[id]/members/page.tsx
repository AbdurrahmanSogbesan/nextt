import prisma from "@/lib/prisma";
import HubMembersClient from "./hub-members-client";
import { createUserMap, getUserInfo } from "@/lib/user-utils";

export default async function HubMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const dbhub = await prisma.hub.findUnique({
    where: { uuid: id },
    include: { members: { where: { isDeleted: { equals: false } } } },
  });

  const uniqueIds = new Set(dbhub?.members.map((m) => m.hubUserid));

  const userMap = await createUserMap(Array.from(uniqueIds));

  const hubMembers = dbhub?.members.map((m) => ({
    ...m,
    user: getUserInfo(userMap, m.hubUserid),
  }));

  return <HubMembersClient hub={dbhub} members={hubMembers} />;
}
