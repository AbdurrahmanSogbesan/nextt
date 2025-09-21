"use client";

import MemberCard from "@/components/MemberCard";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Button } from "@/components/ui/button";
import { MemberUserDetails } from "@/types";
import { useAuth } from "@clerk/nextjs";
import { Hub, HubMembership, Prisma } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { apiGet, apiPatch } from "@/lib/api";
import { updateHubMemberRoleSchema } from "@/lib/schemas";
import { z } from "zod";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";

type HubMembers = Prisma.HubGetPayload<{
  include: {
    members: true;
  };
}>["members"][number] & { user: MemberUserDetails };

type UpdateMemberRoleResponse = {
  membership: Pick<HubMembership, "hubUserid" | "isAdmin" | "dateJoined">;
};

type GetHubMembersResponse = {
  hub: Hub;
  members: HubMembers[];
};

export default function HubMembersPage() {
  const { id } = useParams<{ id: string }>();

  const { userId } = useAuth();
  const queryClient = useQueryClient();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    variant?: "default" | "destructive";
  } | null>(null);

  const { mutateAsync: updateMemberRole, isPending: isUpdatingRole } =
    useMutation({
      mutationKey: ["updateMemberRole"],
      mutationFn: async ({
        memberUserId,
        isAdmin,
      }: z.infer<typeof updateHubMemberRoleSchema>) => {
        if (!id) throw new Error("Hub ID is required");

        const resp = await apiPatch<UpdateMemberRoleResponse>(
          `/api/hubs/members/${id}`,
          {
            memberUserId,
            isAdmin,
          }
        );

        return resp.membership;
      },
      onSuccess: () => {
        // Invalidate and refetch the hub members query
        queryClient.invalidateQueries({ queryKey: ["getHubMembers", id] });
        toast.success("Member role updated successfully");
        setIsModalOpen(false);
      },
      onError: (error: Error) => {
        toast.error(error.message || "Failed to update member role");
      },
    });

  const { mutateAsync: removeMember, isPending: isRemovingMember } =
    useMutation({
      mutationKey: ["removeMember"],
      mutationFn: () => {
        // TODO: Implement remove member API
        return Promise.resolve();
      },
    });

  // Helper function to show confirmation modal
  const showConfirmationModal = (config: typeof modalConfig) => {
    setModalConfig(config);
    setIsModalOpen(true);
  };

  // Handle role change
  const handleRoleChange = (
    member: HubMembers,
    newRole: "ADMIN" | "MEMBER"
  ) => {
    const isAdmin = newRole === "ADMIN";
    const currentRole = member.isAdmin ? "ADMIN" : "MEMBER";

    // Don't show modal if role is already the same
    if (currentRole === newRole) {
      toast.error("Role is already the same");
      return;
    }

    if (member.hubUserid === userId && member.hubUserid !== hub?.ownerId) {
      toast.error("You cannot change your own role");
      return;
    }

    showConfirmationModal({
      title: `${isAdmin ? "Grant" : "Remove"} Admin Access`,
      description: `Are you sure you want to ${
        isAdmin ? "grant" : "remove"
      } admin access ${isAdmin ? "to" : "from"} ${member.user.firstName} ${
        member.user.lastName
      }?`,
      confirmText: isAdmin ? "Grant Admin" : "Remove Admin",
      variant: isAdmin ? "default" : "destructive",
      onConfirm: () => {
        updateMemberRole({
          memberUserId: member.hubUserid,
          isAdmin,
        });
      },
    });
  };

  // Handle member removal
  const handleRemoveMember = (member: HubMembers) => {
    if (member.hubUserid === userId) {
      toast.error("You cannot remove yourself from the hub");
      return;
    }

    showConfirmationModal({
      title: "Remove Member",
      description: `Are you sure you want to remove ${member.user.firstName} ${member.user.lastName} from this hub?`,
      confirmText: "Remove Member",
      variant: "destructive",
      onConfirm: () => {
        removeMember();
      },
    });
  };

  const { isLoading, data } = useQuery({
    queryKey: ["getHubMembers", id],
    queryFn: () => apiGet<GetHubMembersResponse>(`/api/hubs/members/${id}`),
  });

  const { hub, members } = data || {};

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen">
      {!hub || !members ? (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-sm text-muted-foreground">No hub found</p>
        </div>
      ) : (
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

              <Link href={`/hub/${id}/invite`}>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite Hub Member
                </Button>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {members && members.length > 0 ? (
                members.map((member) => {
                  // Check if current user is admin or hub owner
                  const currentUserIsAdmin =
                    hub?.ownerId === userId ||
                    members.find((m) => m.hubUserid === userId)?.isAdmin;

                  // Check if this member is the hub owner
                  const isHubOwner = member.hubUserid === hub?.ownerId;

                  // Check if this member is the current user
                  const isCurrentUser = member.hubUserid === userId;

                  // Logic for showing remove button:
                  // 1. Cannot remove yourself
                  // 2. Cannot remove the hub owner
                  // 3. Only admins and hub owner can remove others
                  const canRemove =
                    !isCurrentUser && !isHubOwner && currentUserIsAdmin;

                  return (
                    <MemberCard
                      key={member.uuid}
                      member={member}
                      btnText={canRemove ? "Remove from Hub" : undefined}
                      dropdownItems={
                        // Only show role change options if user is admin or hub owner
                        // and not trying to change their own role
                        canRemove
                          ? [
                              {
                                label: "Admin",
                                onClick: () =>
                                  handleRoleChange(member, "ADMIN"),
                              },
                              {
                                label: "Member",
                                onClick: () =>
                                  handleRoleChange(member, "MEMBER"),
                              },
                            ]
                          : undefined
                      }
                      role={member.isAdmin ? "ADMIN" : "MEMBER"}
                      onBtnClick={() => handleRemoveMember(member)}
                      isUser={member.hubUserid === userId}
                    />
                  );
                })
              ) : (
                <div className="col-span-full">No members found</div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Confirmation Modal */}
      {modalConfig && (
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          description={modalConfig.description}
          confirmText={modalConfig.confirmText}
          variant={modalConfig.variant}
          isLoading={isUpdatingRole || isRemovingMember}
        />
      )}
    </div>
  );
}
