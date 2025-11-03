import { currentUser, User } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import EditRosterForm from './EditRosterForm';
import BackButton from '../../../../../../../components/BackButton';

// Use your exact helper signature and behavior
async function getMeAndRole(hubId: string, me: User | null) {
  const userId = me?.id || null;
  const hub = await prisma.hub.findUnique({
    where: { id: Number(hubId) },
    include: { members: { where: { hubUserid: userId! } } },
  });

  if (!hub) return { me, hub: null, role: null };
  const role = hub.members![0]?.isAdmin ? 'ADMIN' : 'MEMBER';
  return { me, hub, role };
}

export default async function EditRosterPage({
  params,
}: {
  params: Promise<{ id: string; rosterId: string }>;
}) {
  const { id, rosterId } = await params;
  const me = await currentUser();
  if (!me) redirect('/sign-in');

  const { hub, role } = await getMeAndRole(id, me);
  if (!hub) notFound();
  if (role !== 'ADMIN') notFound();

  const roster = await prisma.roster.findUnique({
    where: { id: Number(rosterId) },
    include: { rotationOption: true },
  });
  if (!roster || roster.hubId !== Number(id) || roster.isDeleted) notFound();

  const initialValues = {
    hubId: Number(id),
    name: roster.name || '',
    description: roster.description || '',
    rotationType: roster.rotationType || 'DAILY',
    start: roster.start,
    end: roster.end,
    enablePushNotifications: !!roster.enablePushNotifications,
    enableEmailNotifications: !!roster.enableEmailNotifications,
    isPrivate: !!roster.isPrivate,
    rotationOption:
      roster.rotationType === 'CUSTOM'
        ? {
            rotation: roster.rotationOption?.rotation || 'DAILY',
            unit: roster.rotationOption?.unit || 1,
          }
        : undefined,
    status: roster.status, // ONGOING | PENDING | COMPLETE
  };

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-4xl px-4 py-8 md:py-12">
        <div className="mb-6 flex items-center justify-between">
          <BackButton fallbackHref={`/hub/${hub.id}/rosters/${roster.id}`} />
          <div className="text-right">
            <h1 className="text-3xl font-semibold tracking-tight">
              Edit Roster
            </h1>
            <p className="text-sm text-muted-foreground">
              Update details and notifications.
            </p>
          </div>
        </div>
        <EditRosterForm
          hubId={Number(id)}
          rosterId={Number(rosterId)}
          initialValues={initialValues}
        />
      </main>
    </div>
  );
}
