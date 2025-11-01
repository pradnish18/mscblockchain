import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { quoteSchema } from '@/lib/schemas';
import { getLiveUSDToINR, calculateSpread } from '@/lib/fx-service';
import { logger } from '@/lib/logger';
import { asyncHandler, ValidationError } from '@/lib/error-handler';
import { v4 as uuidv4 } from 'uuid';

export const POST = asyncHandler(async (request) => {
  const startTime = Date.now();
  const body = await request.json();

  logger.apiRequest('POST', '/api/remit/quote', { amount: body.amountUSDC });

  const validation = quoteSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Invalid quote request', validation.error.format());
  }

  const { amountUSDC, corridor, useLiveRate } = validation.data;

  const config = await prisma.adminConfig.findFirst({
    where: { id: 1 },
  });

  if (!config) {
    logger.warn('Admin config not found for quote generation');
    return NextResponse.json({ error: 'Config not found' }, { status: 404 });
  }

  let fxRate;
  let rateSource;

  if (useLiveRate || process.env.USE_LIVE_RATES === 'true') {
    const liveRate = await getLiveUSDToINR();
    fxRate = calculateSpread(liveRate, 0.5);
    rateSource = 'live';
    logger.info('Using live exchange rate', { rate: liveRate, withSpread: fxRate });
  } else {
    fxRate = parseFloat(config.fxBase) + parseFloat(config.fxSpread);
    rateSource = 'config';
  }

  const amount = parseFloat(amountUSDC);
  const feeBps = config.feeBps;
  const fee = (amount * feeBps) / 10000;
  const feeUSDC = fee.toFixed(6);
  const netINR = (amount * fxRate).toFixed(2);
  const totalUSDC = (amount + fee).toFixed(6);

  const expiresAt = new Date(Date.now() + 90 * 1000);

  const quote = {
    quoteId: uuidv4(),
    amountUSDC,
    feeUSDC,
    totalUSDC,
    fx: fxRate.toFixed(2),
    netINR,
    corridor: corridor || 'USDC-INR',
    expiresAt: expiresAt.toISOString(),
    rateSource,
  };

  const duration = Date.now() - startTime;
  logger.apiResponse('POST', '/api/remit/quote', 200, duration, { quoteId: quote.quoteId });
  logger.business('Quote generated', { quoteId: quote.quoteId, amount, netINR, rateSource });

  return NextResponse.json(quote);
});