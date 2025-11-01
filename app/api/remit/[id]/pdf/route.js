import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { generateReceiptHTML } from '@/lib/pdf';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const shareToken = searchParams.get('shareToken');

    const receipt = await prisma.remitReceipt.findUnique({
      where: { id },
      include: {
        flags: true
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

    // Generate HTML
    const html = await generateReceiptHTML(receipt, receipt.flags);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="receipt-${receipt.id}.html"`
      }
    });
  } catch (error) {
    console.error('GET /api/remit/[id]/pdf error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}