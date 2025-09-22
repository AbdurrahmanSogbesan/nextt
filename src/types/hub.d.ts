import { Hub, Prisma } from "@prisma/client";
import { MemberUserDetails } from ".";

type PrismaHub = Prisma.HubGetPayload<{
  include: {
    members: true;
    rosters: {
      include: { members: true };
    };
    activities: true;
  };
}>;

type HubMember = PrismaHub["members"][number] & { user: MemberUserDetails };

type RosterMember = PrismaHub["rosters"][number]["members"][number] & {
  user: MemberUserDetails;
};

type HubRoster = Omit<PrismaHub["rosters"][number], "members"> & {
  members: RosterMember[];
};

type HubActivity = Omit<PrismaHub["activities"][number], "actor"> & {
  actor: MemberUserDetails | null;
};

export type GetHubResponse = {
  hub: Omit<PrismaHub, "members" | "rosters" | "activities"> & {
    members: HubMember[];
    rosters: HubRoster[];
    activities: HubActivity[];
  };
  userMap: Record<string, MemberUserDetails>;
};

export type UpdateMemberRoleResponse = {
  membership: Pick<HubMember, "hubUserid" | "isAdmin" | "dateJoined">;
};

export type GetHubMembersResponse = {
  hub: Hub;
  members: HubMember[];
};
