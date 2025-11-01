import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { confirmSchema } from '@/lib/schemas';
import { isSandboxMode, parseRemittanceCreatedEvent, simulateRemittanceCreated } from '@/lib/contract';
import { detectFraud, storeFraudFlags } from '@/lib/fraud';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

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
    const { intentId, txHash, senderAddress } = confirmSchema.parse(body);

    // Get intent
    const intent = await prisma.remitIntent.findUnique({
      where: { id: intentId },
      include: { receipt: true }
    });

    if (!intent) {
      return NextResponse.json(
        { error: 'Intent not found' },
        { status: 404 }
      );
    }

    if (intent.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (intent.status === 'ONCHAIN_CONFIRMED') {
      return NextResponse.json(
        { receiptId: intent.receipt.id, message: 'Already confirmed' }
      );
    }

    // Check if expired
    if (new Date() > new Date(intent.expiresAt)) {
      await prisma.remitIntent.update({
        where: { id: intentId },
        data: { status: 'FAILED' }
      });
      return NextResponse.json(
        { error: 'Intent expired' },
        { status: 400 }
      );
    }

    // Parse or simulate event
    let eventData;
    const sandbox = isSandboxMode();

    if (sandbox) {
      // Simulate mode
      eventData = simulateRemittanceCreated(
        txHash,
        senderAddress || session.user.id,
        intent.receiverAddress || intent.receiverPhone,
        intent.amountUSDC,
        intent.feeUSDC,
        intent.corridor
      );
    } else {
      // Real on-chain verification
      try {
        eventData = await parseRemittanceCreatedEvent(txHash);
      } catch (error) {
        console.error('Failed to parse on-chain event:', error);
        await prisma.remitIntent.update({
          where: { id: intentId },
          data: { status: 'FAILED' }
        });
        return NextResponse.json(
          { error: 'Failed to verify transaction on-chain' },
          { status: 400 }
        );
      }
    }

    // Get config for FX calculation
    const config = await prisma.adminConfig.findFirst({ where: { id: 1 } });
    const fxRate = parseFloat(config.fxBase) + parseFloat(config.fxSpread);
    const amountINR = (parseFloat(intent.amountUSDC) * fxRate).toFixed(2);

    // Create receipt
    const receiptId = uuidv4();
    const shareToken = crypto.randomBytes(32).toString('hex');
    const shareExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const receipt = await prisma.remitReceipt.create({
      data: {
        id: receiptId,
        remitId: intentId,
        senderId: session.user.id,
        receiverAddress: eventData.receiver,
        token: eventData.token,
        rawEventJson: JSON.stringify(eventData),
        amountUSDC: intent.amountUSDC,
        feeUSDC: intent.feeUSDC,
        corridor: intent.corridor,
        timestamp: new Date(eventData.timestamp * 1000),
        fxAtSettlement: fxRate.toFixed(2),
        amountINREstimate: amountINR,
        shareToken,
        shareExpiresAt
      }
    });

    // Update intent
    await prisma.remitIntent.update({
      where: { id: intentId },
      data: {
        status: 'ONCHAIN_CONFIRMED',
        txHash,
        remitId: eventData.remitId
      }
    });

    // Run fraud detection
    const fraudFlags = await detectFraud(
      session.user.id,
      eventData.receiver,
      intent.amountUSDC,
      intent.corridor
    );

    await storeFraudFlags(receiptId, fraudFlags);

    // Log audit
    await prisma.auditLog.create({
      data: {
        id: uuidv4(),
        actorId: session.user.id,
        action: 'REMIT_CONFIRMED',
        payloadJson: JSON.stringify({
          intentId,
          receiptId,
          txHash,
          amountUSDC: intent.amountUSDC,
          sandbox
        })
      }
    });

    return NextResponse.json({
      receiptId: receipt.id,
      shareToken,
      fraudFlags: fraudFlags.length,
      sandbox
    });
  } catch (error) {
    console.error('POST /api/remit/confirm error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to confirm remittance' },
      { status: 500 }
    );
  }
}