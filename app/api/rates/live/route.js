import { NextResponse } from 'next/server';
import { getLiveUSDToINR, calculateSpread } from '@/lib/fx-service';
import { logger } from '@/lib/logger';
import { asyncHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export const GET = asyncHandler(async () => {
  const startTime = Date.now();

  logger.apiRequest('GET', '/api/rates/live');

  const baseRate = await getLiveUSDToINR();
  const withSpread = calculateSpread(baseRate, 0.5);

  const response = {
    source: 'live',
    usdToInr: baseRate,
    withSpread: parseFloat(withSpread.toFixed(4)),
    spreadPercent: 0.5,
    timestamp: new Date().toISOString(),
    cacheDuration: 300,
  };

  const duration = Date.now() - startTime;
  logger.apiResponse('GET', '/api/rates/live', 200, duration);

  return NextResponse.json(response);
});