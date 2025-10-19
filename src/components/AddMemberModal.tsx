"use client";

import { useState, useMemo } from "react";
import { DialogHeader, Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, UserPlus, Users } from "lucide-react";
import { useGetHubMembers } from "@/hooks/hub";
import MemberCard from "./MemberCard";
import { ScrollArea } from "./ui/scroll-area";
import Loading from "./Loading";
import { useParams } from "next/navigation";
import { useAddRosterMember } from "@/hooks/roster";

export default function AddMemberModal({
  isOpen,
  handleClose,
  title = "Add Roster Members",
  hubId,
  rosterMembers = [],
  onInviteClick,
}: {
  isOpen: boolean;
  handleClose: VoidFunction;
  title?: string;
  hubId: string;
  rosterMembers?: Array<{ rosterUserId: string }>;
  onInviteClick: VoidFunction;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const { rosterId } = useParams<{ rosterId: string }>();

  const { data, isLoading } = useGetHubMembers(hubId);

  const { mutateAsync: addRosterMember, isPending: isAddingMember } =
    useAddRosterMember(rosterId, () => {
      handleClose();
    });

  // Filter out members that are already in the roster
  const rosterMemberIds = useMemo(
    () => new Set(rosterMembers.map((m) => m.rosterUserId)),
    [rosterMembers]
  );

  const availableMembers = useMemo(() => {
    if (!data?.members) return [];

    // Filter out roster members
    const filtered = data.members.filter(
      (member) => !rosterMemberIds.has(member.hubUserid)
    );

    // Apply search filter
    if (!searchQuery.trim()) return filtered;

    const query = searchQuery.toLowerCase();
    return filtered.filter((member) => {
      const fullName =
        `${member.user.firstName} ${member.user.lastName}`.toLowerCase();
      const email = member.user.email.toLowerCase();
      return fullName.includes(query) || email.includes(query);
    });
  }, [data?.members, rosterMemberIds, searchQuery]);

  const handleInviteClick = () => {
    handleClose();
    onInviteClick();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] min-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-7 flex-1 min-h-0 flex flex-col">
          {/* Search and Invite */}
          <div className="flex gap-2 justify-between">
            <div className="relative w-1/2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleInviteClick} className="shrink-0">
              <UserPlus className="h-4 w-4" />
              Invite
            </Button>
          </div>

          {/* Members Grid */}
          {isLoading ? (
            <div className="flex-1 grid place-items-center">
              <Loading />
            </div>
          ) : availableMembers.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
              <div className="grid place-items-center size-20 rounded-full bg-muted">
                <Users className="size-10 text-muted-foreground" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-medium text-muted-foreground">
                  {searchQuery
                    ? "No members found"
                    : rosterMemberIds.size > 0
                    ? "All hub members are already in this roster"
                    : "No hub members available"}
                </p>
                {!searchQuery && rosterMemberIds.size === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Invite people to join your hub first
                  </p>
                )}
              </div>
              {!searchQuery && (
                <Button onClick={handleInviteClick} variant="outline">
                  <UserPlus className="h-4 w-4" />
                  Invite to Hub
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pb-4">
                {availableMembers.map((member) => (
                  <MemberCard
                    key={member.hubUserid}
                    member={member}
                    btnText="Add"
                    onBtnClick={() =>
                      addRosterMember({ rosterUserId: member.hubUserid })
                    }
                    variant="small"
                    btnLoading={isAddingMember}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
