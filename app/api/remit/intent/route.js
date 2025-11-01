import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { intentSchema } from '@/lib/schemas';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = intentSchema.parse(body);

    // Validate receiver data based on type
    if (data.receiverType === 'PHONE' && !data.receiverPhone) {
      return NextResponse.json(
        { error: 'receiverPhone is required for PHONE type' },
        { status: 400 }
      );
    }
    if (data.receiverType === 'ADDRESS' && !data.receiverAddress) {
      return NextResponse.json(
        { error: 'receiverAddress is required for ADDRESS type' },
        { status: 400 }
      );
    }
    if (data.receiverType === 'ENS' && !data.ensName && !data.receiverAddress) {
      return NextResponse.json(
        { error: 'ensName or receiverAddress is required for ENS type' },
        { status: 400 }
      );
    }

    // Create intent with expiry (90 seconds from now)
    const expiresAt = new Date(Date.now() + 90 * 1000);

    const intent = await prisma.remitIntent.create({
      data: {
        id: uuidv4(),
        userId: session.user.id,
        receiverType: data.receiverType,
        receiverPhone: data.receiverPhone,
        receiverAddress: data.receiverAddress,
        corridor: data.corridor,
        amountUSDC: data.amountUSDC,
        feeUSDC: data.feeUSDC,
        status: 'CREATED',
        expiresAt
      }
    });

    return NextResponse.json({
      intentId: intent.id,
      expiresAt: intent.expiresAt.toISOString(),
      clientSecret: `intent_${intent.id}_secret`
    });
  } catch (error) {
    console.error('POST /api/remit/intent error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create intent' },
      { status: 500 }
    );
  }
}