import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { initiateCashoutSchema } from '@/lib/schemas';
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
    const data = initiateCashoutSchema.parse(body);

    // Verify remit belongs to user
    const intent = await prisma.remitIntent.findUnique({
      where: { id: data.remitId },
      include: { receipt: true, cashout: true }
    });

    if (!intent) {
      return NextResponse.json(
        { error: 'Remittance not found' },
        { status: 404 }
      );
    }

    if (intent.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (intent.status !== 'ONCHAIN_CONFIRMED') {
      return NextResponse.json(
        { error: 'Remittance not confirmed' },
        { status: 400 }
      );
    }

    if (intent.cashout) {
      return NextResponse.json({
        ref: intent.cashout.ref,
        status: intent.cashout.status,
        message: 'Cash-out already initiated'
      });
    }

    // Generate unique reference
    const ref = `RMT${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    const initialEvent = {
      status: 'QUEUED',
      timestamp: new Date().toISOString(),
      note: 'Cash-out request received'
    };

    const cashout = await prisma.cashout.create({
      data: {
        id: uuidv4(),
        remitId: data.remitId,
        ref,
        method: data.method,
        upiId: data.upiId,
        bankAcct: data.bankAcct,
        status: 'QUEUED',
        eventsJson: JSON.stringify([initialEvent])
      }
    });

    // Simulate progression (in real app, this would be a background job)
    setTimeout(async () => {
      try {
        const events = JSON.parse(cashout.eventsJson);
        events.push({
          status: 'PROCESSING',
          timestamp: new Date().toISOString(),
          note: 'Payment processing initiated'
        });
        await prisma.cashout.update({
          where: { id: cashout.id },
          data: { 
            status: 'PROCESSING',
            eventsJson: JSON.stringify(events)
          }
        });

        // Final status after 5 seconds
        setTimeout(async () => {
          const finalEvents = JSON.parse(await prisma.cashout.findUnique({
            where: { id: cashout.id },
            select: { eventsJson: true }
          }).then(c => c.eventsJson));
          
          // 90% success, 10% failure
          const success = Math.random() > 0.1;
          finalEvents.push({
            status: success ? 'PAID' : 'FAILED',
            timestamp: new Date().toISOString(),
            note: success ? 'Payment completed successfully' : 'Payment failed - please retry'
          });
          
          await prisma.cashout.update({
            where: { id: cashout.id },
            data: { 
              status: success ? 'PAID' : 'FAILED',
              eventsJson: JSON.stringify(finalEvents)
            }
          });
        }, 5000);
      } catch (err) {
        console.error('Cashout simulation error:', err);
      }
    }, 2000);

    return NextResponse.json({
      ref,
      status: 'QUEUED',
      method: data.method,
      remitId: data.remitId
    });
  } catch (error) {
    console.error('POST /api/cashout/initiate error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to initiate cash-out' },
      { status: 500 }
    );
  }
}