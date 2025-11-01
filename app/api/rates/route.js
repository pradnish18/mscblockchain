import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getLiveUSDToINR, calculateSpread } from '@/lib/fx-service';
import { logger } from '@/lib/logger';
import { asyncHandler } from '@/lib/error-handler';

export const GET = asyncHandler(async (request) => {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const useLive = searchParams.get('live') === 'true';

  logger.apiRequest('GET', '/api/rates', { useLive });

  if (useLive || process.env.USE_LIVE_RATES === 'true') {
    const baseRate = await getLiveUSDToINR();
    const withSpread = calculateSpread(baseRate, 0.5);

    const response = {
      source: 'live',
      base: baseRate,
      spread: 0.5,
      usdcInr: parseFloat(withSpread.toFixed(4)),
      timestamp: new Date().toISOString(),
    };

    const duration = Date.now() - startTime;
    logger.apiResponse('GET', '/api/rates', 200, duration);

    return NextResponse.json(response);
  }

  const config = await prisma.adminConfig.findFirst({
    where: { id: 1 },
  });

  if (!config) {
    logger.warn('Admin config not found');
    return NextResponse.json({ error: 'Config not found' }, { status: 404 });
  }

  const usdcInr = parseFloat(config.fxBase) + parseFloat(config.fxSpread);

  const response = {
    source: 'config',
    base: config.fxBase,
    spread: config.fxSpread,
    usdcInr: usdcInr.toFixed(2),
    updatedAt: config.updatedAt,
  };

  const duration = Date.now() - startTime;
  logger.apiResponse('GET', '/api/rates', 200, duration);

  return NextResponse.json(response);
});