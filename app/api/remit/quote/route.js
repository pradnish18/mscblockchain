import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { quoteSchema } from '@/lib/schemas';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const body = await request.json();
    const { amountUSDC, corridor } = quoteSchema.parse(body);

    // Get current config
    const config = await prisma.adminConfig.findFirst({
      where: { id: 1 }
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Config not found' },
        { status: 404 }
      );
    }

    // Calculate fee
    const amount = parseFloat(amountUSDC);
    const feeBps = config.feeBps;
    const fee = (amount * feeBps) / 10000;
    const feeUSDC = fee.toFixed(6);

    // Calculate FX
    const fxRate = parseFloat(config.fxBase) + parseFloat(config.fxSpread);
    const netINR = (amount * fxRate).toFixed(2);
    const totalUSDC = (amount + fee).toFixed(6);

    // Quote valid for 90 seconds
    const expiresAt = new Date(Date.now() + 90 * 1000);

    return NextResponse.json({
      quoteId: uuidv4(),
      amountUSDC,
      feeUSDC,
      totalUSDC,
      fx: fxRate.toFixed(2),
      netINR,
      corridor: corridor || 'USDC-INR',
      expiresAt: expiresAt.toISOString()
    });
  } catch (error) {
    console.error('POST /api/remit/quote error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to generate quote' },
      { status: 500 }
    );
  }
}