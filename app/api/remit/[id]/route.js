import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('shareToken');

    const receipt = await prisma.remitReceipt.findUnique({
      where: { id },
      include: {
        flags: true,
        intent: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }

    // Check authorization
    const session = await getServerSession(authOptions);
    const isOwner = session?.user?.id === receipt.senderId;
    const hasValidShareToken = shareToken && 
      receipt.shareToken === shareToken && 
      new Date() < new Date(receipt.shareExpiresAt);

    if (!isOwner && !hasValidShareToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Parse raw event
    const eventData = JSON.parse(receipt.rawEventJson);

    return NextResponse.json({
      id: receipt.id,
      remitId: receipt.remitId,
      senderId: receipt.senderId,
      receiverAddress: receipt.receiverAddress,
      token: receipt.token,
      amountUSDC: receipt.amountUSDC,
      feeUSDC: receipt.feeUSDC,
      corridor: receipt.corridor,
      timestamp: receipt.timestamp,
      fxAtSettlement: receipt.fxAtSettlement,
      amountINREstimate: receipt.amountINREstimate,
      txHash: eventData.txHash,
      blockNumber: eventData.blockNumber,
      shareToken: isOwner ? receipt.shareToken : null,
      shareExpiresAt: isOwner ? receipt.shareExpiresAt : null,
      flags: receipt.flags,
      createdAt: receipt.createdAt
    });
  } catch (error) {
    console.error('GET /api/remit/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipt' },
      { status: 500 }
    );
  }
}