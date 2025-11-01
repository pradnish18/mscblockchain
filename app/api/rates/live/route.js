import { NextResponse } from 'next/server';

// This would integrate with a real FX API like CurrencyAPI, Exchangerate-API, etc.
// For now, we'll use the database config but show how to integrate real APIs

export async function GET() {
  try {
    // In production, you would call a real FX API:
    // const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    // const data = await response.json();
    // const inrRate = data.rates.INR;
    
    // For this demo, we'll use a realistic simulated rate with slight variation
    const baseRate = 83.15;
    const variation = (Math.random() - 0.5) * 0.5; // +/- 0.25
    const currentRate = (baseRate + variation).toFixed(2);
    
    return NextResponse.json({
      source: 'demo',
      usd_inr: parseFloat(currentRate),
      timestamp: new Date().toISOString(),
      note: 'In production, integrate with CurrencyAPI or Exchangerate-API'
    });
  } catch (error) {
    console.error('Live rates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch live rates' },
      { status: 500 }
    );
  }
}