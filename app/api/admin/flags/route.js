import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');

    const where = {};
    if (severity) {
      where.severity = severity;
    }

    const flags = await prisma.fraudFlag.findMany({
      where,
      include: {
        receipt: {
          include: {
            intent: {
              select: {
                userId: true,
                corridor: true,
                createdAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 200
    });

    return NextResponse.json({ flags });
  } catch (error) {
    console.error('GET /api/admin/flags error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fraud flags' },
      { status: 500 }
    );
  }
}