import { Hub, HubMembership, Prisma } from "@prisma/client";
import { MemberUserDetails } from ".";
import { createHubSchema, updateHubMemberRoleSchema } from "@/lib/schemas";

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

type HubActivity = PrismaHub["activities"][number] & {
  actor: MemberUserDetails;
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

export type CreateHubForm = z.infer<typeof createHubSchema>;

export type UpdateHubMemberRoleParams = z.infer<
  typeof updateHubMemberRoleSchema
>;

export type CreateInviteParams = {
  email: string;
  hubId: string;
  rosterId?: string;
};

export type HubInvite = Prisma.InviteGetPayload<{
  include: { hub: true; roster: true };
}>;

export type RemoveHubMemberParams = {
  hubUserId: string;
};

export type RemoveHubMemberResponse = {
  member: HubMembership;
};
