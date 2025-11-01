'use client';

import { useState } from 'react';

// Simplified Web3 provider - lazy load wagmi to reduce initial bundle
export function Web3Provider({ children }) {
  return <>{children}</>;
}