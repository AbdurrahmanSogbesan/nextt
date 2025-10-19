"use client";

import { notFound, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

import { Activity, MoreHorizontal, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import MemberCard from "@/components/MemberCard";
import { accent } from "@/lib/theme";
import { useAuth } from "@clerk/nextjs";
import Loading from "@/components/Loading";
import { getFormattedDate, getUserInfo } from "@/lib/utils";
import ActivityCard from "@/components/ActivityCard";
import RosterTurnPrompt from "@/components/RosterTurnPrompt";
import RosterSchedule from "@/components/RosterSchedule";
import CommentSection from "@/components/CommentSection";
import {
  useGetRoster,
  useStartRoster,
  useCompleteTurn,
  useAddComment,
} from "@/hooks/roster";
import { ROTATION_CHOICE, STATUS_CHOICE } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TurnCard from "@/components/TurnCard";
import { useState } from "react";
import AddMemberModal from "@/components/AddMemberModal";
import InviteModal from "@/components/InviteModal";

export default function RosterDashboard() {
  const { userId } = useAuth();
  const { rosterId, id: hubId } = useParams<{ rosterId: string; id: string }>();
  const [showModal, setShowModal] = useState<"invite" | "addMember" | null>(
    null
  );

  const handleCloseModal = () => {
    setShowModal(null);
  };

  const { data, isLoading } = useGetRoster(rosterId);

  const startRoster = useStartRoster(rosterId);
  const completeTurn = useCompleteTurn(rosterId);
  const addComment = useAddComment(rosterId);

  const { roster, userMap: userMapRecord } = data || {};

  if (isLoading) return <Loading />;
  if (!roster) return notFound();

  // Convert Record back to Map for getUserInfo function
  const userMap = userMapRecord
    ? new Map(Object.entries(userMapRecord))
    : new Map();

  const theme = accent(roster.hub?.theme || "indigo");
  const memberCount = roster.members.length;
  const isStarted = roster.status === STATUS_CHOICE.ONGOING;
  const isCurrentTurn = roster.currentTurnId === userId;

  // Get current user's turn info if they're the current turn
  const [currentTurn] = roster.turns;

  const creatorDetails = getUserInfo(userMap, roster.createdById || "");

  return (
    <div className="min-h-screen">
      {/* Hero band */}
      <section className="relative backdrop-blur-2xl">
        <div className="relative mx-auto w-full max-w-6xl px-4 py-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-start justify-between w-full">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {roster.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Created by {creatorDetails.firstName}{" "}
                  {creatorDetails.lastName}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit roster
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 space-y-10">
        {/* Current turn prompt */}
        {isCurrentTurn && currentTurn && (
          <RosterTurnPrompt
            rosterName={roster.name}
            dueDate={roster.nextDate}
            onComplete={() => {
              const currentTurnId = roster.turns.find(
                (t) => t.rosterMembershipRosterUserId === roster.currentTurnId
              )?.id as number;
              completeTurn.mutate(currentTurnId);
            }}
            theme={theme}
            isCompleting={completeTurn.isPending}
          />
        )}

        {/* Schedule/Turns section */}
        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <TurnCard
              title="Current"
              rightText={
                roster.currentTurnId === userId
                  ? "Me"
                  : `${
                      getUserInfo(userMap, roster.currentTurnId || "").firstName
                    } ${
                      getUserInfo(userMap, roster.currentTurnId || "").lastName
                    }`
              }
              image={getUserInfo(userMap, roster.currentTurnId || "").avatarUrl}
              theme={theme}
            />
            <TurnCard
              title="Due Date"
              badgeText={getFormattedDate(roster.nextDate)}
              theme={theme}
            />
            <TurnCard
              title="Next"
              rightText={
                roster.nextTurnId === userId
                  ? "Me"
                  : `${
                      getUserInfo(userMap, roster.nextTurnId || "").firstName
                    } ${getUserInfo(userMap, roster.nextTurnId || "").lastName}`
              }
              image={getUserInfo(userMap, roster.nextTurnId || "").avatarUrl}
              theme={theme}
              isActive
            />
          </div>
        </section>

        {/* Members */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Members ({memberCount})</h2>
            <Link
              href={`/hubs/${hubId}/rosters/${rosterId}/members`}
              className="text-sm text-muted-foreground hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roster.members.slice(0, 3).map((m) => (
              <MemberCard
                key={m.uuid}
                member={m}
                btnText="Message"
                // onBtnClick={() => {}}
              />
            ))}

            {/* Add member */}
            <button
              onClick={() => setShowModal("addMember")}
              className="grid place-items-center h-full rounded-2xl border border-dashed bg-background/60 p-6 hover:bg-background transition-colors"
            >
              <div className="flex flex-col items-center gap-3">
                <div
                  className={`grid h-10 w-10 place-items-center rounded-full ${theme.softBg}`}
                >
                  <Plus className="h-5 w-5 opacity-80" />
                </div>
                <p className="text-sm">Add a member</p>
              </div>
            </button>
          </div>
        </section>

        {/* Schedule */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Schedule</h2>
          <RosterSchedule
            members={roster.members}
            currentTurnId={roster.currentTurnId}
            rotationType={roster.rotationType || ROTATION_CHOICE.DAILY}
            rotationOption={roster.rotationOption}
            nextDate={roster.nextDate}
            isStarted={isStarted}
            onStartRoster={() => startRoster.mutate()}
            isStarting={startRoster.isPending}
            theme={theme}
          />
        </section>

        {/* Activities */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Activities</h2>
          <div className="space-y-4">
            {roster.activities.length > 0 ? (
              roster.activities
                .slice(0, 5)
                .map((a) => (
                  <ActivityCard
                    key={a.id}
                    title={a.title}
                    body={a.body ?? ""}
                    actor={a.actor}
                    createdAt={a.createdAt}
                    variant="primary"
                  />
                ))
            ) : (
              <div className="w-full flex flex-col items-center gap-6 py-8">
                <Activity
                  className="h-24 w-24 text-muted-foreground/80"
                  strokeWidth={1}
                />
                <span className="font-medium text-muted-foreground text-center">
                  No activity yet.
                  <br />
                  Start the roster or invite members to get things moving.
                </span>
              </div>
            )}
          </div>
        </section>

        <CommentSection
          comments={roster.comments}
          addCommentMutation={addComment}
        />
      </main>

      <AddMemberModal
        isOpen={showModal === "addMember"}
        handleClose={handleCloseModal}
        hubId={hubId}
        rosterMembers={roster.members}
        onInviteClick={() => setShowModal("invite")}
      />

      <InviteModal
        show={showModal === "invite"}
        onClose={handleCloseModal}
        title="Send Invitation"
        isRosterInvite
      />
    </div>
  );
}
