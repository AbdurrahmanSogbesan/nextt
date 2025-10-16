import { Prisma } from "@prisma/client";
import { createRosterSchema } from "@/lib/schemas";
import { z } from "zod";
import { MemberUserDetails } from ".";

type PrismaRoster = Prisma.RosterGetPayload<{
  include: {
    members: true;
    activities: true;
    comments: true;
    rotationOption: true;
    turns: true;
    hub: true;
  };
}>;

type RosterMember = PrismaRoster["members"][number] & {
  user: MemberUserDetails;
};

type RosterTurn = PrismaRoster["turns"][number] & {
  user: MemberUserDetails & { userId: string };
};

type RosterActivity = PrismaRoster["activities"][number] & {
  actor: MemberUserDetails;
};

type RosterComment = PrismaRoster["comments"][number] & {
  user: MemberUserDetails;
};

export type GetRosterResponse = {
  roster: Omit<
    PrismaRoster,
    "members" | "activities" | "comments" | "turns"
  > & {
    members: RosterMember[];
    activities: RosterActivity[];
    comments: RosterComment[];
    turns: RosterTurn[];
  };
  userMap: Record<string, MemberUserDetails>;
};

export type CreateRosterForm = z.infer<typeof createRosterSchema>;
