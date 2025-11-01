import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { ref } = params;

    const cashout = await prisma.cashout.findUnique({
      where: { ref },
      include: {
        intent: {
          include: {
            receipt: true
          }
        }
      }
    });

    if (!cashout) {
      return NextResponse.json(
        { error: 'Cash-out not found' },
        { status: 404 }
      );
    }

    const events = JSON.parse(cashout.eventsJson);

    return NextResponse.json({
      ref: cashout.ref,
      status: cashout.status,
      method: cashout.method,
      upiId: cashout.upiId,
      bankAcct: cashout.bankAcct,
      events,
      remittance: {
        amountUSDC: cashout.intent.receipt.amountUSDC,
        amountINR: cashout.intent.receipt.amountINREstimate,
        corridor: cashout.intent.receipt.corridor
      },
      createdAt: cashout.createdAt,
      updatedAt: cashout.updatedAt
    });
  } catch (error) {
    console.error('GET /api/cashout/[ref]/status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cash-out status' },
      { status: 500 }
    );
  }
}