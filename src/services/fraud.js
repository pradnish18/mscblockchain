import prisma from './prisma';

/**
 * Fraud Detection Rules for RemitChain
 * Returns array of fraud flags
 */
export async function detectFraud(senderId, receiverAddress, amountUSDC, corridor) {
  const flags = [];
  
  try {
    // Get sender's remittance history
    const senderHistory = await prisma.remitIntent.findMany({
      where: {
        userId: senderId,
        status: 'ONCHAIN_CONFIRMED'
      },
      include: {
        receipt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Rule 1: New sender (first transaction)
    if (senderHistory.length === 0) {
      flags.push({
        rule: 'NEW_SENDER',
        severity: 'MEDIUM',
        score: 50,
        note: 'First transaction from this sender'
      });
    }

    // Rule 2: New receiver (never sent to this address before)
    const sentToReceiver = senderHistory.some(
      intent => intent.receipt?.receiverAddress.toLowerCase() === receiverAddress.toLowerCase()
    );
    
    if (!sentToReceiver && senderHistory.length > 0) {
      flags.push({
        rule: 'NEW_RECEIVER',
        severity: 'MEDIUM',
        score: 40,
        note: 'First transaction to this receiver'
      });
    }

    // Rule 3: Amount > P95 of sender's history
    if (senderHistory.length >= 5) {
      const amounts = senderHistory
        .map(intent => parseFloat(intent.amountUSDC))
        .sort((a, b) => a - b);
      
      const p95Index = Math.floor(amounts.length * 0.95);
      const p95Amount = amounts[p95Index];
      
      if (parseFloat(amountUSDC) > p95Amount) {
        flags.push({
          rule: 'AMOUNT_ABOVE_P95',
          severity: 'HIGH',
          score: 80,
          note: `Amount ${amountUSDC} USDC exceeds P95 (${p95Amount.toFixed(2)} USDC) of sender history`
        });
      }
    }

    // Rule 4: High frequency (>3 transactions in last minute)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentCount = await prisma.remitIntent.count({
      where: {
        userId: senderId,
        createdAt: {
          gte: oneMinuteAgo
        }
      }
    });
    
    if (recentCount >= 3) {
      flags.push({
        rule: 'HIGH_FREQUENCY',
        severity: 'HIGH',
        score: 90,
        note: `${recentCount} transactions in last minute`
      });
    }

    // Rule 5: Unusual corridor for sender
    if (senderHistory.length >= 3) {
      const corridorCounts = {};
      senderHistory.forEach(intent => {
        corridorCounts[intent.corridor] = (corridorCounts[intent.corridor] || 0) + 1;
      });
      
      const mostCommonCorridor = Object.keys(corridorCounts).reduce((a, b) => 
        corridorCounts[a] > corridorCounts[b] ? a : b
      );
      
      if (corridor !== mostCommonCorridor && !corridorCounts[corridor]) {
        flags.push({
          rule: 'UNUSUAL_CORRIDOR',
          severity: 'MEDIUM',
          score: 60,
          note: `Corridor ${corridor} is unusual; sender typically uses ${mostCommonCorridor}`
        });
      }
    }

  } catch (error) {
    console.error('Fraud detection error:', error);
    // Don't fail the transaction, just log
  }

  return flags;
}

/**
 * Store fraud flags in database
 */
export async function storeFraudFlags(receiptId, flags) {
  if (!flags || flags.length === 0) return [];
  
  const created = await Promise.all(
    flags.map(flag => 
      prisma.fraudFlag.create({
        data: {
          remitId: receiptId,
          rule: flag.rule,
          score: flag.score,
          severity: flag.severity,
          note: flag.note
        }
      })
    )
  );
  
  return created;
}