"use client";

import { notFound, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  ClipboardList,
  Info,
  Lock,
  Plus,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { getFormattedDate } from "@/lib/utils";
import MemberCard from "@/components/MemberCard";
import { accent } from "@/lib/theme";
import TurnCard from "@/components/TurnCard";
import AvatarStack from "@/components/AvatarStack";
import Initials from "@/components/Initials";
import { useAuth } from "@clerk/nextjs";
import Loading from "@/components/Loading";
import { getUserInfo } from "@/lib/utils";
import { useGetHub, useUpdateLastVisitStatus } from "@/hooks/hub";

export default function HubDashboard() {
  const { userId } = useAuth();
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useGetHub(id);

  const { hub, userMap: userMapRecord } = data || {};
  const isMember = hub?.members.some((m) => m.hubUserid === userId!);

  useUpdateLastVisitStatus(id, {
    enabled: !!hub && !isLoading && isMember,
  });

  if (isLoading) return <Loading />;

  if (!hub) return notFound();

  // Convert Record back to Map for getUserInfo function
  const userMap = userMapRecord
    ? new Map(Object.entries(userMapRecord))
    : new Map();

  if (!isMember && hub.visibility === "PRIVATE") return notFound();

  const theme = accent(hub.theme || "indigo");

  const memberCount = hub.members.length;

  const rosterCount = hub.rosters?.length ?? 0;

  const hasRosters = rosterCount > 0;
  const firstRoster = hub.rosters?.[0];

  function getTurnInfo(turnId: string | null) {
    // turn id is user reference
    if (!turnId) return { name: "Unknown", avatarUrl: "", isMe: false };
    const user = getUserInfo(userMap, turnId);
    return {
      name: user.firstName + " " + user.lastName,
      avatarUrl: user.avatarUrl,
      isMe: turnId === userId!,
    };
  }

  return (
    <div className="min-h-screen">
      {/* Hero band */}
      <section className={`relative border-b backdrop-blur-2xl`}>
        <div className="relative mx-auto w-full max-w-6xl px-4 py-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm text-muted-foreground">
                Welcome back, {getUserInfo(userMap, userId!).firstName}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {hub.name}
              </h1>
              {hub.description && (
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  {hub.description}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Link href={`/hub/${hub.id}/invite`}>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite to hub
                </Button>
              </Link>
              <Link href={`/hub/${hub.id}/rosters/create`}>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create roster
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:max-w-xl">
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription>Hub mates</CardDescription>
                <CardTitle className="text-3xl">{memberCount}</CardTitle>
              </CardHeader>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription>Rosters</CardDescription>
                <CardTitle className="text-3xl">{rosterCount}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 space-y-10">
        {/* Tasks strip - placeholder chips you can wire to tasks */}
        {hasRosters && (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium">
                Tasks breakdown for {firstRoster?.name}
              </h2>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Info className="h-3.5 w-3.5" /> Info
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <TurnCard
                title="Current"
                rightText={
                  getTurnInfo(firstRoster.currentTurnId).isMe
                    ? "Me"
                    : getTurnInfo(firstRoster.currentTurnId).name
                }
                image={getTurnInfo(firstRoster.currentTurnId).avatarUrl}
                theme={theme}
              />
              <TurnCard
                title="Due Date"
                badgeText={getFormattedDate(firstRoster?.nextDate)}
                theme={theme}
              />
              <TurnCard
                title="Next"
                rightText={
                  getTurnInfo(firstRoster.nextTurnId).isMe
                    ? "Me"
                    : getTurnInfo(firstRoster.nextTurnId).name
                }
                image={getTurnInfo(firstRoster.nextTurnId).avatarUrl}
                theme={theme}
                isActive
              />
            </div>
          </section>
        )}

        {/* Rosters */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Rosters</h2>
            <Link
              href={`/hub/${hub.id}/rosters`}
              className="text-sm text-muted-foreground hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="flex flex-col space-y-3">
            {hub.rosters.length > 0 ? (
              hub.rosters.slice(0, 3).map((r) => (
                <Link key={r.id} href={`/hub/${hub.id}/rosters/${r.id}`}>
                  <div className="group flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-sm transition hover:shadow">
                    <div className="flex items-center gap-3">
                      <div
                        className={`grid h-9 w-9 place-items-center rounded-xl ${theme.softBg} ring-1 ring-border`}
                      >
                        <span className="h-2 w-2 rounded-full bg-current" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{r.name}</p>
                          {r.isPrivate && (
                            <Lock className="h-3.5 w-3.5 opacity-60" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {r.members.length} members
                        </p>
                      </div>
                    </div>
                    <AvatarStack
                      people={r.members.map((m) => ({
                        name: `${m.user.firstName} ${m.user.lastName}`,
                        avatarUrl: m.user.avatarUrl,
                      }))}
                    />
                  </div>
                </Link>
              ))
            ) : (
              <div className="w-full flex flex-col items-center gap-6 py-8">
                <ClipboardList
                  className="h-24 w-24 text-muted-foreground/80"
                  strokeWidth={1}
                />
                <span className="font-medium text-muted-foreground">
                  You don&apos;t belong to any Roster yet...{" "}
                  <Link
                    href={`/hub/${hub.id}/rosters/create`}
                    className="text-primary hover:underline"
                  >
                    Create here
                  </Link>
                </span>
              </div>
            )}

            {/* Create roster dashed card */}
            <Link href={`/hub/${hub.id}/rosters/create`}>
              <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed bg-background/60 px-4 py-6 text-sm text-muted-foreground hover:bg-background">
                <Plus className="h-4 w-4" /> Create a roster
              </div>
            </Link>
          </div>
        </section>

        {/* Hub mates */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Hub mates ({memberCount})</h2>
            <Link
              href={`/hub/${hub.id}/members`}
              className="text-sm text-muted-foreground hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hub.members.slice(0, 3).map((m) => {
              return (
                <MemberCard
                  key={m.uuid}
                  member={m}
                  btnText="Message"
                  // onBtnClick={() => {}}
                />
              );
            })}

            {/* Add member */}
            <Link href={`/hub/${hub.id}/invite`}>
              <div className="grid place-items-center h-full rounded-2xl border border-dashed bg-background/60 p-6 hover:bg-background">
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={`grid h-10 w-10 place-items-center rounded-full ${theme.softBg}`}
                  >
                    <Plus className="h-5 w-5 opacity-80" />
                  </div>
                  <p className="text-sm">Add a member</p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Activities */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Activities</h2>
          <div className="space-y-3">
            {hub.activities.length > 0 ? (
              // todo: add load more button
              hub.activities.slice(0, 5).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-xl border bg-card px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={a.actor?.avatarUrl || ""} />
                      <AvatarFallback>
                        <Initials
                          name={`${a.actor?.firstName} ${a.actor?.lastName}`}
                        />
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                      <p className="font-medium">{a.title || "Activity"}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.body || a.title}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
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
                  Create a roster or invite a member to get things moving.
                </span>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
