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
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const min = searchParams.get('min');
    const max = searchParams.get('max');
    const flagged = searchParams.get('flagged') === 'true';

    // Build where clause
    const where = {
      status: 'ONCHAIN_CONFIRMED'
    };

    if (from) {
      where.createdAt = { ...where.createdAt, gte: new Date(from) };
    }
    if (to) {
      where.createdAt = { ...where.createdAt, lte: new Date(to) };
    }
    if (min) {
      where.amountUSDC = { ...where.amountUSDC, gte: min };
    }
    if (max) {
      where.amountUSDC = { ...where.amountUSDC, lte: max };
    }

    let remits = await prisma.remitIntent.findMany({
      where,
      include: {
        receipt: {
          include: {
            flags: true
          }
        },
        user: {
          select: {
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    if (flagged) {
      remits = remits.filter(r => r.receipt && r.receipt.flags.length > 0);
    }

    return NextResponse.json({ remits });
  } catch (error) {
    console.error('GET /api/admin/remit error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch remittances' },
      { status: 500 }
    );
  }
}