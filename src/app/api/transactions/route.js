import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get user's confirmed remittances with receipts
    const transactions = await prisma.remitIntent.findMany({
      where: {
        userId: session.user.id,
        status: 'ONCHAIN_CONFIRMED'
      },
      include: {
        receipt: {
          include: {
            flags: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    const total = await prisma.remitIntent.count({
      where: {
        userId: session.user.id,
        status: 'ONCHAIN_CONFIRMED'
      }
    });

    return NextResponse.json({
      transactions: transactions.map(tx => ({
        id: tx.id,
        receiptId: tx.receipt?.id,
        receiverAddress: tx.receiverAddress || tx.receiverPhone,
        receiverType: tx.receiverType,
        corridor: tx.corridor,
        amountUSDC: tx.amountUSDC,
        feeUSDC: tx.feeUSDC,
        amountINR: tx.receipt?.amountINREstimate,
        status: tx.status,
        txHash: tx.txHash,
        createdAt: tx.createdAt,
        fraudFlags: tx.receipt?.flags?.length || 0,
        hasFraud: (tx.receipt?.flags?.length || 0) > 0
      })),
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error('GET /api/transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}