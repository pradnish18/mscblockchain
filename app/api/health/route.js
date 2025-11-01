import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const checks = {};

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart,
    };
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    checks.database = {
      status: 'unhealthy',
      error: error.message,
    };
  }

  if (process.env.SANDBOX_MODE !== 'true') {
    try {
      const rpcUrl = process.env.CHAIN_RPC;
      if (rpcUrl) {
        const rpcStart = Date.now();
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_blockNumber',
            params: [],
            id: 1,
          }),
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          checks.blockchain = {
            status: 'healthy',
            responseTime: Date.now() - rpcStart,
          };
        } else {
          checks.blockchain = {
            status: 'unhealthy',
            httpStatus: response.status,
          };
        }
      } else {
        checks.blockchain = {
          status: 'skipped',
          reason: 'RPC URL not configured',
        };
      }
    } catch (error) {
      logger.error('Blockchain health check failed', { error: error.message });
      checks.blockchain = {
        status: 'unhealthy',
        error: error.message,
      };
    }
  } else {
    checks.blockchain = {
      status: 'skipped',
      reason: 'Sandbox mode enabled',
    };
  }

  const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    checks.configuration = {
      status: 'unhealthy',
      missing: missingVars,
    };
  } else {
    checks.configuration = {
      status: 'healthy',
    };
  }

  const allHealthy = Object.values(checks).every(
    (check) => check.status === 'healthy' || check.status === 'skipped'
  );

  const response = {
    timestamp: new Date().toISOString(),
    status: allHealthy ? 'healthy' : 'degraded',
    checks,
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    },
    responseTime: Date.now() - startTime,
  };

  logger.info('Health check completed', {
    status: response.status,
    responseTime: response.responseTime,
  });

  return NextResponse.json(response, {
    status: allHealthy ? 200 : 503,
  });
}
