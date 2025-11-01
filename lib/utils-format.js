/**
 * Format currency values
 */
export function formatUSDC(amount) {
  return parseFloat(amount).toFixed(2);
}

export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}

/**
 * Truncate address
 */
export function truncateAddress(address, start = 6, end = 4) {
  if (!address) return '';
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Format date
 */
export function formatDate(date) {
  return new Date(date).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

/**
 * Calculate time remaining
 */
export function getTimeRemaining(expiresAt) {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires - now;
  
  if (diff <= 0) return { expired: true, seconds: 0 };
  
  return {
    expired: false,
    seconds: Math.floor(diff / 1000)
  };
}

/**
 * Check if sandbox mode
 */
export function isSandboxMode() {
  return process.env.NEXT_PUBLIC_SANDBOX_MODE === 'true' || 
         !process.env.NEXT_PUBLIC_REMIT_HUB_ADDRESS || 
         !process.env.NEXT_PUBLIC_USDC_ADDRESS;
}