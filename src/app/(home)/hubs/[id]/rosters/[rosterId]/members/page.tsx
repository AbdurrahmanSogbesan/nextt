"use client";

import MemberCard from "@/components/MemberCard";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@clerk/nextjs";
import { UserPlus, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useParams } from "next/navigation";
import Loading from "@/components/Loading";
import {
  useGetRosterMembers,
  useRemoveRosterMember,
  useUpdateRosterMemberRole,
} from "@/hooks/roster";
import { RosterMember } from "@/types/roster";
import InviteModal from "@/components/InviteModal";
import AddMemberModal from "@/components/AddMemberModal";

export default function RosterMembersPage() {
  const { id: hubId, rosterId } = useParams<{
    id: string;
    rosterId: string;
  }>();

  const { userId } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [openModal, setOpenModal] = useState<
    "role" | "remove" | "invite" | "addMember" | null
  >(null);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    variant?: "default" | "destructive";
    type: "role" | "remove";
  } | null>(null);

  const { mutateAsync: updateMemberRole, isPending: isUpdatingRole } =
    useUpdateRosterMemberRole(rosterId, () => {
      setOpenModal(null);
    });

  const { mutateAsync: removeMember, isPending: isRemovingMember } =
    useRemoveRosterMember(rosterId, () => {
      setOpenModal(null);
    });

  const showConfirmationModal = (config: typeof modalConfig) => {
    setModalConfig(config);
    setOpenModal(config?.type ?? null);
  };

  const handleRoleChange = (
    member: RosterMember,
    newRole: "ADMIN" | "MEMBER"
  ) => {
    const isAdmin = newRole === "ADMIN";
    const currentRole = member.isAdmin ? "ADMIN" : "MEMBER";

    if (currentRole === newRole) {
      toast.error("Role is already the same");
      return;
    }

    if (member.rosterUserId === userId) {
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
          rosterUserId: member.rosterUserId,
          isAdmin,
        });
      },
      type: "role",
    });
  };

  const handleRemoveMember = (member: RosterMember) => {
    if (member.rosterUserId === userId) {
      toast.error("You cannot remove yourself from the roster");
      return;
    }

    showConfirmationModal({
      title: "Remove Member",
      description: `Are you sure you want to remove ${member.user.firstName} ${member.user.lastName} from this roster?`,
      confirmText: "Remove Member",
      variant: "destructive",
      onConfirm: () => {
        removeMember({ rosterUserId: member.rosterUserId });
      },
      type: "remove",
    });
  };

  const { data, isLoading } = useGetRosterMembers(rosterId);

  const { roster, members } = data || {};

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    if (!members) return [];
    if (!searchQuery.trim()) return members;

    const query = searchQuery.toLowerCase();
    return members.filter((member) => {
      const fullName =
        `${member.user.firstName} ${member.user.lastName}`.toLowerCase();
      const email = member.user.email.toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }, [members, searchQuery]);

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen">
      {!roster || !members ? (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-sm text-muted-foreground">No roster found</p>
        </div>
      ) : (
        <section>
          <div className="relative flex flex-col gap-6 mx-auto w-full max-w-6xl px-6 lg:px-4 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  {roster?.name} Members
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                  {members?.length} member{members?.length !== 1 ? "s" : ""} in
                  this roster
                </p>
              </div>

              <Button
                className="gap-2"
                onClick={() => setOpenModal("addMember")}
              >
                <UserPlus className="h-4 w-4" />
                Add Member
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative self-end max-w-[500px] w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {filteredMembers && filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                  // Check if current user is admin
                  const currentUserMembership = members.find(
                    (m) => m.rosterUserId === userId
                  );
                  const currentUserIsAdmin =
                    currentUserMembership?.isAdmin || false;

                  // Check if this member is the current user
                  const isCurrentUser = member.rosterUserId === userId;

                  // Logic for showing remove button:
                  // 1. Cannot remove yourself
                  // 2. Only admins can remove others
                  const canRemove = !isCurrentUser && currentUserIsAdmin;

                  return (
                    <MemberCard
                      key={member.uuid}
                      member={member}
                      btnText={canRemove ? "Remove from Roster" : undefined}
                      dropdownItems={
                        // Only show role change options if user is admin
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
                      isUser={member.rosterUserId === userId}
                    />
                  );
                })
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "No members found matching your search"
                      : "No members found"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Confirmation Modal */}
      {modalConfig && (
        <ConfirmationModal
          isOpen={openModal === "role" || openModal === "remove"}
          onClose={() => setOpenModal(null)}
          onConfirm={modalConfig.onConfirm}
          title={modalConfig.title}
          description={modalConfig.description}
          confirmText={modalConfig.confirmText}
          variant={modalConfig.variant}
          isLoading={isUpdatingRole || isRemovingMember}
        />
      )}

      <InviteModal
        show={openModal === "invite"}
        onClose={() => setOpenModal(null)}
        title="Invite Roster Member"
        isRosterInvite
      />

      <AddMemberModal
        isOpen={openModal === "addMember"}
        handleClose={() => setOpenModal(null)}
        hubId={hubId}
        rosterMembers={roster.members}
        onInviteClick={() => setOpenModal("invite")}
      />
    </div>
  );
}
