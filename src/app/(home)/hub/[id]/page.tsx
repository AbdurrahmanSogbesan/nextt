import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Info, Lock, Plus, UserPlus } from 'lucide-react';
import Link from 'next/link';

// Map your saved hub.theme to utility classes.
// Tailwind cannot read dynamic class names, so keep this mapping in code.
const accent = (t?: string) => {
  const M = {
    indigo: {
      softBg: 'bg-indigo-500/15',
      solidBg: 'bg-indigo-500',
      text: 'text-indigo-600',
      ring: 'ring-indigo-500/30',
      chip: 'bg-indigo-600/10 text-indigo-700',
      dot: 'bg-indigo-500',
    },
    sky: {
      softBg: 'bg-sky-400/15',
      solidBg: 'bg-sky-400',
      text: 'text-sky-600',
      ring: 'ring-sky-400/30',
      chip: 'bg-sky-600/10 text-sky-700',
      dot: 'bg-sky-400',
    },
    rose: {
      softBg: 'bg-rose-500/15',
      solidBg: 'bg-rose-500',
      text: 'text-rose-600',
      ring: 'ring-rose-500/30',
      chip: 'bg-rose-600/10 text-rose-700',
      dot: 'bg-rose-500',
    },
    emerald: {
      softBg: 'bg-emerald-500/15',
      solidBg: 'bg-emerald-500',
      text: 'text-emerald-600',
      ring: 'ring-emerald-500/30',
      chip: 'bg-emerald-600/10 text-emerald-700',
      dot: 'bg-emerald-500',
    },
    amber: {
      softBg: 'bg-amber-500/20',
      solidBg: 'bg-amber-500',
      text: 'text-amber-600',
      ring: 'ring-amber-500/30',
      chip: 'bg-amber-600/10 text-amber-700',
      dot: 'bg-amber-500',
    },
    zinc: {
      softBg: 'bg-zinc-600/15',
      solidBg: 'bg-zinc-600',
      text: 'text-zinc-700',
      ring: 'ring-zinc-600/30',
      chip: 'bg-zinc-700/10 text-zinc-700',
      dot: 'bg-zinc-600',
    },
  } as const;
  return M[(t as keyof typeof M) || 'indigo'];
};

// Small helpers
function Initials({ name }: { name?: string | null }) {
  const n = (name || '').trim();
  const parts = n.split(' ');
  const init = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  return <>{init.toUpperCase() || 'U'}</>;
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
          <AvatarImage src={p.avatarUrl || ''} />
          <AvatarFallback className="text-[10px]">
            <Initials name={p.name || ''} />
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

export default async function HubDashboard({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();

  if (!userId) redirect('/sign-in');

  // const hub = await prisma.hub
  //   .findUnique({
  //     where: { id: params.id },
  //     include: {
  //       members: { include: { user: true }, orderBy: { joinedAt: 'desc' } },
  //       // If you have these models, great. If not, see the schema note at the end.
  //       rosters: {
  //         include: { members: true },
  //         orderBy: { createdAt: 'desc' },
  //         take: 10,
  //       },
  //       activities: {
  //         include: { actor: true },
  //         orderBy: { createdAt: 'desc' },
  //         take: 8,
  //       },
  //     },
  //   })
  //   .catch(() => null as any);

  const hub = {
    id: 'dummy-hub-id',
    name: 'Dummy Hub',
    description: 'This is a dummy hub for testing purposes.',
    visibility: 'PUBLIC',
    members: [
      {
        id: 'dummy-user-id',
        joinedAt: new Date(),
        user: {
          firstName: 'Oluwabusayo',
          lastName: 'Jacobs',
          email: 'jacobsbusayo@gmail.com',
          avatarUrl: 'https://i.pravatar.cc/150?img=3',
        },
      },
      {
        id: 'dummy-user-id-2',
        joinedAt: new Date(),
        user: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@example.com',
          avatarUrl: 'https://i.pravatar.cc/150?img=4',
        },
      },
    ],
    rosters: [
      {
        id: 'dummy-roster-id',
        name: 'Dummy Roster',
        description: 'This is a dummy roster for testing purposes.',
        createdAt: new Date(),
        updatedAt: new Date(),
        isLocked: false,
        members: [
          {
            id: 'dummy-user-id',
            joinedAt: new Date(),
            user: {
              firstName: 'Oluwabusayo',
              lastName: 'Jacobs',
              email: 'jacobsbusayo@gmail.com',
              avatarUrl: 'https://i.pravatar.cc/150?img=3',
            },
          },
        ],
      },
      {
        id: 'dummy-roster-id-2',
        name: 'Dummy Roster 2',
        description: 'This is a dummy roster for testing purposes.',
        createdAt: new Date(),
        updatedAt: new Date(),
        isLocked: false,
        members: [
          {
            id: 'dummy-user-id-2',
            joinedAt: new Date(),
            user: {
              firstName: 'Jane',
              lastName: 'Doe',
              email: 'jane.doe@example.com',
              avatarUrl: 'https://i.pravatar.cc/150?img=4',
            },
          },
        ],
      },
    ],
    activities: [
      {
        id: 'dummy-activity-id',
        title: 'Dummy Activity',
        subtitle: 'This is a dummy activity subtitle.',
        description: 'This is a dummy activity for testing purposes.',
        createdAt: new Date(),
        updatedAt: new Date(),
        actor: {
          id: 'dummy-user-id',
          joinedAt: new Date(),

          firstName: 'Oluwabusayo',
          lastName: 'Jacobs',
          email: 'jacobsbusayo@gmail.com',
          avatarUrl: 'https://i.pravatar.cc/150?img=3',
        },
      },
      {
        id: 'dummy-activity-id-2',
        title: 'Dummy Activity 2',
        subtitle: 'This is a dummy activity subtitle.',
        description: 'This is a dummy activity for testing purposes.',
        createdAt: new Date(),
        updatedAt: new Date(),
        actor: {
          id: 'dummy-user-id-2',
          joinedAt: new Date(),
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@example.com',
          avatarUrl: 'https://i.pravatar.cc/150?img=4',
        },
      },
    ],
    theme: 'indigo',
  };

  if (!hub) notFound();

  const isMember = hub.members.some((m) => m.id === userId);
  if (!isMember && hub.visibility === 'PRIVATE') notFound();

  const theme = accent(hub.theme || 'indigo');

  const memberCount = hub.members.length;
  const rosterCount = hub.rosters?.length ?? 0;

  return (
    <div className="min-h-screen">
      {/* Hero band */}
      <section className={`relative border-b backdrop-blur-2xl`}>
        <div className="relative mx-auto w-full max-w-6xl px-4 py-8">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {'Oluwabusayo Jacobs'}
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
              <Link href={`/hub/${hub.id}/rosters/new`}>
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
              <div className={`h-1 w-full ${theme.solidBg}`} />
            </Card>

            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardDescription>Rosters</CardDescription>
                <CardTitle className="text-3xl">{rosterCount}</CardTitle>
              </CardHeader>
              <div className={`h-1 w-full ${theme.solidBg}`} />
            </Card>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 space-y-10">
        {/* Tasks strip - placeholder chips you can wire to tasks */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">Tasks breakdown</h2>
            <Badge variant="secondary" className="gap-1 text-xs">
              <Info className="h-3.5 w-3.5" /> Info
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="flex items-center justify-between rounded-xl border bg-background/80 px-4 py-3">
              <div className="text-sm font-medium">Current</div>
              <Avatar className="h-6 w-6">
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
            </div>
            <div className="flex items-center justify-between rounded-xl border bg-background/80 px-4 py-3">
              <div className="text-sm font-medium">Due date</div>
              <Badge variant="outline" className={`${theme.chip}`}>
                Tomorrow
              </Badge>
            </div>
            <div
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${theme.softBg}`}
            >
              <div className="text-sm font-medium">Next</div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Me</span>
                <AvatarStack
                  people={hub.members.slice(0, 3).map((m) => ({
                    name: `${m.user.firstName} ${m.user.lastName}`,
                    avatarUrl: m.user.avatarUrl,
                  }))}
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border bg-background/80 px-4 py-3">
              <div className="text-sm font-medium">Overdue</div>
              <Badge variant="secondary">0</Badge>
            </div>
          </div>
        </section>

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

          <div className="space-y-3">
            {(hub.rosters ?? []).map((r) => (
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
                        {r.isLocked && (
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
            ))}

            {/* Create roster dashed card */}
            <Link href={`/hub/${hub.id}/rosters/new`}>
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
              const full = `${m.user.firstName} ${m.user.lastName}`;
              return (
                <Card key={m.id} className="rounded-2xl">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={m.user.avatarUrl || ''} />
                        <AvatarFallback>
                          <Initials name={full} />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-tight">
                          {full}
                        </p>
                        <p className="text-xs text-muted-foreground">
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
            <Link href={`/hub/${hub.id}/invite`}>
              <div className="grid place-items-center rounded-2xl border border-dashed bg-background/60 p-6 hover:bg-background">
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
            {(hub.activities ?? []).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-xl border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={a.actor?.avatarUrl || ''} />
                    <AvatarFallback>
                      <Initials
                        name={`${a.actor?.firstName} ${a.actor?.lastName}`}
                      />
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">{a.title || 'Activity'}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.subtitle || a.description}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(a.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}

            {/* Empty state */}
            {(!hub.activities || hub.activities.length === 0) && (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No activity yet. Create a roster or invite a member to get
                  things moving.
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <Separator className="my-6" />
      </main>
    </div>
  );
}
