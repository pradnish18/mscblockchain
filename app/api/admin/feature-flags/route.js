import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { updateFeatureFlagSchema } from '@/lib/schemas';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const flags = await prisma.featureFlag.findMany();
    
    // Parse JSON values
    const parsed = flags.map(f => ({
      ...f,
      value: JSON.parse(f.value)
    }));

    return NextResponse.json({ flags: parsed });
  } catch (error) {
    console.error('GET /api/admin/feature-flags error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key, value } = updateFeatureFlagSchema.parse(body);

    // Upsert feature flag
    const flag = await prisma.featureFlag.upsert({
      where: { key },
      update: {
        value: JSON.stringify(value)
      },
      create: {
        id: uuidv4(),
        key,
        value: JSON.stringify(value)
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        actorId: session.user.id,
        action: 'UPDATE_FEATURE_FLAG',
        payloadJson: JSON.stringify({ key, value })
      }
    });

    return NextResponse.json({
      ...flag,
      value: JSON.parse(flag.value)
    });
  } catch (error) {
    console.error('POST /api/admin/feature-flags error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update feature flag' },
      { status: 500 }
    );
  }
}