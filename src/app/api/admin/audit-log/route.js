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
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where = {};
    if (action) {
      where.action = action;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200)
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('GET /api/admin/audit-log error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}