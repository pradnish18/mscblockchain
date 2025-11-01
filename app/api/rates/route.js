import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const config = await prisma.adminConfig.findFirst({
      where: { id: 1 }
    });

    if (!config) {
      return NextResponse.json(
        { error: 'Config not found' },
        { status: 404 }
      );
    }

    const usdcInr = parseFloat(config.fxBase) + parseFloat(config.fxSpread);

    return NextResponse.json({
      base: config.fxBase,
      spread: config.fxSpread,
      usdcInr: usdcInr.toFixed(2),
      updatedAt: config.updatedAt
    });
  } catch (error) {
    console.error('GET /api/rates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rates' },
      { status: 500 }
    );
  }
}