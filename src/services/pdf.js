import crypto from 'crypto';
import QRCode from 'qrcode';

/**
 * Generate receipt HMAC signature
 */
export function generateReceiptSignature(receiptData) {
  const secret = process.env.RECEIPT_SIGNING_SECRET || 'default-secret';
  const dataString = JSON.stringify(receiptData);
  return crypto.createHmac('sha256', secret).update(dataString).digest('hex');
}

/**
 * Generate QR code data URL
 */
export async function generateQRCode(text) {
  try {
    return await QRCode.toDataURL(text, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
  } catch (err) {
    console.error('QR code generation failed:', err);
    return null;
  }
}

/**
 * Generate simple HTML-based PDF receipt
 * (We'll use a simple HTML template instead of PDFKit for easier implementation)
 */
export async function generateReceiptHTML(receipt, flags = []) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const receiptUrl = `${baseUrl}/receipt/${receipt.id}`;
  const qrCode = await generateQRCode(receiptUrl);
  
  const signatureData = {
    id: receipt.id,
    remitId: receipt.remitId,
    senderId: receipt.senderId,
    receiverAddress: receipt.receiverAddress,
    amountUSDC: receipt.amountUSDC,
    feeUSDC: receipt.feeUSDC,
    timestamp: receipt.timestamp.toISOString()
  };
  
  const signature = generateReceiptSignature(signatureData);
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
    .title { font-size: 18px; color: #666; margin-top: 5px; }
    .section { margin: 20px 0; }
    .label { font-weight: bold; color: #555; margin-top: 10px; }
    .value { color: #000; font-family: monospace; word-break: break-all; }
    .amount { font-size: 24px; font-weight: bold; color: #10b981; }
    .qr-code { text-align: center; margin: 20px 0; }
    .qr-code img { border: 2px solid #e5e7eb; padding: 10px; }
    .fraud-flags { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; margin: 20px 0; border-radius: 5px; }
    .flag { margin: 5px 0; }
    .flag.HIGH { color: #dc2626; }
    .flag.MEDIUM { color: #f59e0b; }
    .flag.LOW { color: #10b981; }
    .signature { background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; margin-top: 30px; font-size: 12px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">⛓️ RemitChain</div>
    <div class="title">Decentralized Remittance Receipt</div>
  </div>
  
  <div class="section">
    <div class="label">Receipt ID:</div>
    <div class="value">${receipt.id}</div>
  </div>
  
  <div class="section">
    <div class="label">On-Chain Remittance ID:</div>
    <div class="value">${receipt.remitId}</div>
  </div>
  
  <div class="section">
    <div class="label">Transaction Hash:</div>
    <div class="value">${JSON.parse(receipt.rawEventJson).txHash || 'N/A'}</div>
  </div>
  
  <div class="section">
    <div class="label">Date & Time:</div>
    <div class="value">${receipt.timestamp.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })}</div>
  </div>
  
  <div class="section">
    <div class="label">From (Sender):</div>
    <div class="value">${receipt.senderId}</div>
  </div>
  
  <div class="section">
    <div class="label">To (Receiver):</div>
    <div class="value">${receipt.receiverAddress}</div>
  </div>
  
  <div class="section">
    <div class="label">Corridor:</div>
    <div class="value">${receipt.corridor}</div>
  </div>
  
  <div class="section">
    <div class="label">Amount Sent:</div>
    <div class="amount">${receipt.amountUSDC} USDC</div>
  </div>
  
  <div class="section">
    <div class="label">Fee:</div>
    <div class="value">${receipt.feeUSDC} USDC</div>
  </div>
  
  <div class="section">
    <div class="label">Exchange Rate:</div>
    <div class="value">1 USDC = ${receipt.fxAtSettlement} INR</div>
  </div>
  
  <div class="section">
    <div class="label">Estimated INR Amount:</div>
    <div class="amount">${receipt.amountINREstimate} INR</div>
  </div>
  
  ${flags.length > 0 ? `
  <div class="fraud-flags">
    <div class="label">⚠️ Security Flags:</div>
    ${flags.map(flag => `
      <div class="flag ${flag.severity}">
        <strong>${flag.severity}:</strong> ${flag.rule} - ${flag.note}
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  ${qrCode ? `
  <div class="qr-code">
    <div class="label">Scan to view online:</div>
    <img src="${qrCode}" alt="QR Code" />
  </div>
  ` : ''}
  
  <div class="signature">
    <div class="label">Receipt Signature (HMAC-SHA256):</div>
    <div class="value" style="font-size: 10px;">${signature}</div>
    <div style="margin-top: 10px; color: #666; font-size: 11px;">
      This signature provides tamper-evidence. Verify authenticity at remitchain.io/verify
    </div>
  </div>
  
  <div class="footer">
    <p>RemitChain - Decentralized Cross-Border Remittance Platform</p>
    <p>Powered by Polygon • USDC Stablecoin</p>
  </div>
</body>
</html>
  `;
  
  return html;
}