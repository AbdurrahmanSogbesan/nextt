"use client";

import MemberCard from "@/components/MemberCard";
import { Button } from "@/components/ui/button";
import { MemberUserDetails } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { Hub, Prisma } from "@prisma/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import Link from "next/link";

type HubMembers = Prisma.HubGetPayload<{
  include: {
    members: true;
  };
}>["members"][number] & { user: MemberUserDetails };

export default function HubMembersClient({
  hub,
  members,
}: {
  hub: Hub | null;
  members: HubMembers[] | undefined;
}) {
  const { userId } = useAuth();

  const { mutateAsync: updateMemberRole } = useMutation({
    mutationKey: ["updateMemberRole"],
    mutationFn: ({
      memberId,
      role,
    }: {
      memberId: string;
      role: "ADMIN" | "MEMBER";
    }) => {
      // handle the mutation
      return Promise.resolve();
    },
  });

  const { mutateAsync: removeMember } = useMutation({
    mutationKey: ["removeMember"],
    mutationFn: ({ memberId }: { memberId: string }) => {
      // handle the mutation
      return Promise.resolve();
    },
  });

  return (
    <div className="min-h-screen">
      <section>
        <div className="relative flex flex-col gap-6 mx-auto w-full max-w-6xl px-6 lg:px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {hub?.name} Members
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                {members?.length} member{members?.length !== 1 ? "s" : ""} in
                this hub
              </p>
            </div>

            <Link href={`/hub/${hub?.uuid}/invite`}>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Hub Member
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {members && members.length > 0 ? (
              members.map((member) => {
                const canRemove =
                  member.hubUserid !== userId &&
                  (member.isAdmin || hub?.ownerId === userId);
                return (
                  <MemberCard
                    key={member.uuid}
                    member={member}
                    btnText={
                      // Only show remove from hub button if the member is not the current user and is an admin or the hub owner
                      canRemove ? "Remove from Hub" : undefined
                    }
                    dropdownItems={
                      // Change the role of the member
                      // todo: add confirmation modal which calls the mutation
                      [
                        {
                          label: "Admin",
                          onClick: () => console.log("Admin:", member.user),
                        },

                        {
                          label: "Member",
                          onClick: () => console.log("Member:", member.user),
                        },
                      ]
                    }
                    role={member.isAdmin ? "ADMIN" : "MEMBER"}
                    onBtnClick={() => {
                      // todo: open confirmation modal which calls the remove member mutation
                    }}
                  />
                );
              })
            ) : (
              <div className="col-span-full">No members found</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
