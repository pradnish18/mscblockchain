import { NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { resolveEnsSchema } from '@/lib/schemas';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name } = resolveEnsSchema.parse(body);

    // Use Polygon Amoy provider
    const rpcUrl = process.env.CHAIN_RPC || 'https://rpc-amoy.polygon.technology';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Note: ENS resolution typically works on Ethereum mainnet
    // For demo purposes, we'll return mock data or try mainnet
    let address = null;
    
    try {
      // Try mainnet ENS resolution
      const mainnetProvider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
      address = await mainnetProvider.resolveName(name);
    } catch (ensError) {
      console.log('ENS resolution failed:', ensError.message);
    }

    if (!address) {
      return NextResponse.json(
        { error: 'ENS name not found or invalid' },
        { status: 404 }
      );
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error('POST /api/contacts/resolve-ens error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to resolve ENS name' },
      { status: 500 }
    );
  }
}