import { auth, clerkClient } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import prisma from "@/lib/prisma";
import { cn, getFormattedDate } from "@/lib/utils";

// Map your saved hub.theme to utility classes.
// Tailwind cannot read dynamic class names, so keep this mapping in code.
const accent = (t?: string) => {
  const M = {
    indigo: {
      softBg: "bg-indigo-500/15",
      solidBg: "bg-indigo-500",
      text: "text-indigo-600",
      ring: "ring-indigo-500/30",
      chip: "bg-indigo-600/10 text-indigo-700",
      dot: "bg-indigo-500",
    },
    sky: {
      softBg: "bg-sky-400/15",
      solidBg: "bg-sky-400",
      text: "text-sky-600",
      ring: "ring-sky-400/30",
      chip: "bg-sky-600/10 text-sky-700",
      dot: "bg-sky-400",
    },
    rose: {
      softBg: "bg-rose-500/15",
      solidBg: "bg-rose-500",
      text: "text-rose-600",
      ring: "ring-rose-500/30",
      chip: "bg-rose-600/10 text-rose-700",
      dot: "bg-rose-500",
    },
    emerald: {
      softBg: "bg-emerald-500/15",
      solidBg: "bg-emerald-500",
      text: "text-emerald-600",
      ring: "ring-emerald-500/30",
      chip: "bg-emerald-600/10 text-emerald-700",
      dot: "bg-emerald-500",
    },
    amber: {
      softBg: "bg-amber-500/20",
      solidBg: "bg-amber-500",
      text: "text-amber-600",
      ring: "ring-amber-500/30",
      chip: "bg-amber-600/10 text-amber-700",
      dot: "bg-amber-500",
    },
    zinc: {
      softBg: "bg-zinc-600/15",
      solidBg: "bg-zinc-600",
      text: "text-zinc-700",
      ring: "ring-zinc-600/30",
      chip: "bg-zinc-700/10 text-zinc-700",
      dot: "bg-zinc-600",
    },
  } as const;
  return M[(t as keyof typeof M) || "indigo"];
};

// Small helpers
function Initials({ name }: { name?: string | null }) {
  const n = (name || "").trim();
  const parts = n.split(" ");
  const init = (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  return <>{init.toUpperCase() || "U"}</>;
}

function AvatarStack({
  people,
  max = 5,
}: {
  people: { name?: string | null; avatarUrl?: string | null }[];
  max?: number;
}) {
  const shown = people.slice(0, max);
  const extra = Math.max(0, people.length - shown.length);
  return (
    <div className="flex -space-x-2">
      {shown.map((p, i) => (
        <Avatar key={i} className="h-7 w-7 ring-2 ring-background">
          <AvatarImage src={p.avatarUrl || ""} />
          <AvatarFallback className="text-[10px]">
            <Initials name={p.name || ""} />
          </AvatarFallback>
        </Avatar>
      ))}
      {extra > 0 && (
        <div className="grid h-7 w-7 place-items-center rounded-full bg-muted text-xs font-medium ring-2 ring-background">
          +{extra}
        </div>
      )}
    </div>
  );
}

function TurnCard({
  title,
  className,
  image,
  rightText,
  badgeText,
  isActive,
  theme,
}: {
  title: string;
  className?: string;
  image?: string;
  rightText?: string;
  badgeText?: string;
  isActive?: boolean;
  theme?: ReturnType<typeof accent>;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border px-4 py-3 transition-all",
        className,
        isActive && `${theme?.chip} border-transparent`
      )}
    >
      <div className="text-sm font-medium">{title}</div>

      <div className="flex items-center gap-2">
        {rightText && (
          <span
            className={cn(
              "text-xs text-muted-foreground",
              isActive && theme?.text
            )}
          >
            {rightText}
          </span>
        )}
        {image && (
          <Avatar className="h-6 w-6">
            <AvatarImage src={image} />
            <AvatarFallback>ME</AvatarFallback>
          </Avatar>
        )}
        {badgeText && (
          <Badge variant="outline" className={`${theme?.chip}`}>
            {badgeText}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default async function HubDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) redirect("/sign-in");

  const hubSkeleton = await prisma.hub
    .findUnique({
      where: { uuid: id },
      include: {
        members: { orderBy: { dateJoined: "desc" } },
        rosters: {
          include: { members: true },
          take: 10,
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 8,
        },
      },
    })
    .catch(() => null);

  const uniqueIds = new Set([
    ...(hubSkeleton?.members.map((m) => m.hubUserid) || []),
    ...(hubSkeleton?.rosters.flatMap((ros) =>
      ros.members.map((rom) => rom.rosterUserId)
    ) || []),
  ]);

  const client = await clerkClient();

  const { data: usersData } = await client.users.getUserList({
    userId: Array.from(uniqueIds),
  });

  // Create user map for quick lookups
  const userMap = new Map(
    usersData.map((user) => [
      user.id,
      {
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.emailAddresses[0]?.emailAddress || "",
        avatarUrl: user.imageUrl,
      },
    ])
  );

  // Helper function to get user info or fallback
  const getUserInfo = (userId: string) =>
    userMap.get(userId) || {
      firstName: "Unknown",
      lastName: "User",
      email: "",
      avatarUrl: "",
    };

  // Enrich hub data with user information
  const hub = {
    ...hubSkeleton,
    members:
      hubSkeleton?.members.map((member) => ({
        ...member,
        user: getUserInfo(member.hubUserid),
      })) || [],
    rosters:
      hubSkeleton?.rosters.map((roster) => ({
        ...roster,
        members: roster.members.map((member) => ({
          ...member,
          user: getUserInfo(member.rosterUserId),
        })),
      })) || [],
    activities:
      hubSkeleton?.activities.map((activity) => ({
        ...activity,
        actor: activity.actorId ? getUserInfo(activity.actorId) : null,
      })) || [],
  };

  if (!hub) notFound();

  const isMember = hub.members.some((m) => m.hubUserid === userId);
  if (!isMember && hub.visibility === "PRIVATE") notFound();

  const theme = accent(hub.theme || "indigo");

  const memberCount = hub.members.length;

  const rosterCount = hub.rosters?.length ?? 0;

  const hasRosters = rosterCount > 0;
  const firstRoster = hub.rosters?.[0];

  function getTurnInfo(turnId: string | null) {
    // turn id is user reference
    if (!turnId) return { name: "Unknown", avatarUrl: "", isMe: false };
    const user = getUserInfo(turnId);
    return {
      name: user.firstName + " " + user.lastName,
      avatarUrl: user.avatarUrl,
      isMe: turnId === userId,
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
                Welcome back, {getUserInfo(userId).firstName}
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
              <Link href={`/hub/${hub.uuid}/invite`}>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite to hub
                </Button>
              </Link>
              <Link href={`/hub/${hub.uuid}/rosters/new`}>
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
              href={`/hub/${hub.uuid}/rosters`}
              className="text-sm text-muted-foreground hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {hub.rosters.length > 0 ? (
              hub.rosters.slice(0, 3).map((r) => (
                <Link key={r.id} href={`/hub/${hub.uuid}/rosters/${r.id}`}>
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
                    href={`/hub/${hub.uuid}/rosters/new`}
                    className="text-primary hover:underline"
                  >
                    Create here
                  </Link>
                </span>
              </div>
            )}

            {/* Create roster dashed card */}
            <Link href={`/hub/${hub.uuid}/rosters/new`}>
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
              href={`/hub/${hub.uuid}/members`}
              className="text-sm text-muted-foreground hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hub.members.slice(0, 3).map((m) => {
              const fullName = `${m.user.firstName} ${m.user.lastName}`;
              return (
                <Card key={m.uuid} className="rounded-2xl">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src={m.user.avatarUrl || ""} />
                        <AvatarFallback>
                          <Initials name={fullName} />
                        </AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <p className="text-sm font-medium leading-tight truncate">
                          {fullName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {m.user.email}
                        </p>
                      </div>
                    </div>
                    <Button variant="secondary" className="mt-4 w-full">
                      Message
                    </Button>
                  </CardContent>
                </Card>
              );
            })}

            {/* Add member */}
            <Link href={`/hub/${hub.uuid}/invite`}>
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
              hub.activities.map((a) => (
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
