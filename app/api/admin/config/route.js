import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { updateConfigSchema } from '@/lib/schemas';
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

    const config = await prisma.adminConfig.findFirst({ where: { id: 1 } });
    return NextResponse.json(config);
  } catch (error) {
    console.error('GET /api/admin/config error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch config' },
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
    const data = updateConfigSchema.parse(body);

    // Get current config
    const current = await prisma.adminConfig.findFirst({ where: { id: 1 } });

    // Update config
    const updated = await prisma.adminConfig.update({
      where: { id: 1 },
      data: {
        feeBps: data.feeBps !== undefined ? data.feeBps : current.feeBps,
        fxBase: data.fxBase || current.fxBase,
        fxSpread: data.fxSpread || current.fxSpread
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        actorId: session.user.id,
        action: 'UPDATE_CONFIG',
        payloadJson: JSON.stringify({
          previous: current,
          updated: updated
        })
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('POST /api/admin/config error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update config' },
      { status: 500 }
    );
  }
}