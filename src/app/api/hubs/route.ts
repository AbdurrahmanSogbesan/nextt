import { NextResponse } from 'next/server';
import { z } from 'zod';
import slugify from 'slugify';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { createHubSchema } from '@/lib/schemas';

// Schema matches the frontend form schema

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createHubSchema.parse(body);

    const baseSlug = slugify(validatedData.name, {
      lower: true,
      strict: true,
    });

    const slug = `${baseSlug}-${new Date().getTime()}`;

    const hub = await prisma.hub.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || '',
        logo: validatedData.logoUrl || null,
        theme: validatedData.theme || null,
        visibility: validatedData.visibility,
        slug,
        // set user as owner of the hub
        ownerId: userId,
        // Create initial hub membership for owner
        members: {
          create: [{ hubUserid: userId, isAdmin: true }],
        },
      },
    });

    return NextResponse.json({ id: hub.id });
  } catch (error) {
    console.error('Error creating hub:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: z.flattenError(error) },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create hub' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const memberships = await prisma.hubMembership.findMany({
    where: { hubUserid: userId },
    include: { hub: true },
    orderBy: { dateJoined: 'desc' },
  });

  const hubs = memberships.map((m) => ({
    id: m.hub.id,
    name: m.hub.name,
    logo: m.hub.logo,
    theme: m.hub.theme,
    visibility: m.hub.visibility,
    members: undefined, // keep payload light
  }));

  return NextResponse.json({ hubs });
}
