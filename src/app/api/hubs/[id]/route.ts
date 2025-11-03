import prisma from '@/lib/prisma';
import { createUserMap } from '@/lib/clerk-utils';
import { getUserInfo } from '@/lib/utils';
import { auth, currentUser, User } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { VISIBILITY_CHOICE } from '@prisma/client';
import { z } from 'zod';
import { PrismaHub } from '../../../../types/hub';

const Schema = z.object({
  name: z.string().min(2),
  description: z.string().max(500).optional().or(z.literal('')),
  logo: z.string().url().nullable().optional(),
  theme: z
    .enum(['indigo', 'sky', 'rose', 'emerald', 'amber', 'zinc'])
    .optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE', 'UNLISTED']).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbhub = await prisma.hub.findUnique({
      where: { id: parseInt(id), isDeleted: false },
      include: {
        members: {
          where: { isDeleted: false },
          orderBy: { dateJoined: 'desc' },
        },
        rosters: {
          where: { isDeleted: false },
          include: { members: { where: { isDeleted: false } } },
        },
        activities: {
          where: { isDeleted: false },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!dbhub) {
      return NextResponse.json({ error: 'Hub not found' }, { status: 404 });
    }

    // Access control: Only allow active members to access private hubs
    if (dbhub.visibility === VISIBILITY_CHOICE.PRIVATE) {
      const isActiveMember = dbhub.members.some(
        (member) => member.hubUserid === userId
      );
      if (!isActiveMember) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const uniqueIds = new Set([
      ...dbhub.members.map((m) => m.hubUserid),
      ...dbhub.rosters.flatMap((ros) =>
        ros.members.map((rom) => rom.rosterUserId)
      ),
    ]);

    const userMap = await createUserMap(Array.from(uniqueIds));

    // Enrich hub data with user information
    const hub = {
      ...dbhub,
      members: dbhub.members.map((member) => ({
        ...member,
        user: getUserInfo(userMap, member.hubUserid),
      })),
      rosters: dbhub.rosters.map((roster) => ({
        ...roster,
        members: roster.members.map((member) => ({
          ...member,
          user: getUserInfo(userMap, member.rosterUserId),
        })),
      })),
      activities: dbhub.activities.map((activity) => ({
        ...activity,
        actor: getUserInfo(userMap, activity.actorId ?? ''),
      })),
    };

    const userMapObj = Object.fromEntries(userMap);

    return NextResponse.json({ hub, userMap: userMapObj });
  } catch (error) {
    console.error('Error getting hub:', error);

    return NextResponse.json({ error: 'Failed to get hub' }, { status: 500 });
  }
}

async function getMeAndRole(hubId: string, me: User | null) {
  const userId = me?.id || null;
  const hub: Partial<PrismaHub> | null = await prisma.hub.findUnique({
    where: { id: Number(hubId) },
    include: { members: { where: { hubUserid: userId! } } },
  });

  if (!hub) return { me, hub: null, role: null };
  const role = hub.members![0]?.isAdmin ? 'ADMIN' : 'MEMBER';
  return { me, hub, role };
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await currentUser();
  const userId = user?.id || null;
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  const { me, role } = await getMeAndRole(params.id, user);
  if (!me) return new NextResponse('Onboarding required', { status: 400 });

  if (role !== 'ADMIN') return new NextResponse('Forbidden', { status: 403 });

  const json = await req.json();
  const body = Schema.parse(json);

  const updated = await prisma.hub.update({
    where: { id: Number(params.id) },
    data: {
      name: body.name,
      description: body.description ?? null,
      logo: body.logo ?? null,
      theme: body.theme,
      visibility: body.visibility,
    },
  });

  return NextResponse.json({ id: updated.id });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await currentUser();
  const userId = user?.id || null;
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  const hub = await prisma.hub.findUnique({ where: { id: Number(params.id) } });
  if (!hub) return new NextResponse('Not found', { status: 404 });

  if (hub.ownerId !== userId)
    return new NextResponse('Only the owner can delete', { status: 403 });
  await prisma.$transaction(async (tx) => {
    const hubId = Number(params.id);
    await tx.hubMembership.deleteMany({ where: { hubId } });
    await tx.rosterMembership
      ?.deleteMany({ where: { roster: { hubId } } })
      .catch(() => {});
    await tx.roster?.deleteMany({ where: { hubId } }).catch(() => {});
    await tx.activity?.deleteMany({ where: { hubId } }).catch(() => {});
    await tx.hub.delete({ where: { id: hubId } });
  });

  return NextResponse.json({ ok: true });
}
