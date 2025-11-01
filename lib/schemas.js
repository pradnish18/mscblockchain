import { z } from 'zod';

// Auth schemas
export const emailSchema = z.object({
  email: z.string().email()
});

// Quote schema
export const quoteSchema = z.object({
  amountUSDC: z.string().regex(/^\d+(\.\d{1,6})?$/, 'Invalid USDC amount'),
  corridor: z.string().default('USDC-INR')
});

// Intent schema
export const intentSchema = z.object({
  receiverType: z.enum(['PHONE', 'ADDRESS', 'ENS']),
  receiverPhone: z.string().optional(),
  receiverAddress: z.string().optional(),
  ensName: z.string().optional(),
  corridor: z.string().default('USDC-INR'),
  amountUSDC: z.string().regex(/^\d+(\.\d{1,6})?$/),
  feeUSDC: z.string().regex(/^\d+(\.\d{1,6})?$/)
});

// Confirm schema
export const confirmSchema = z.object({
  intentId: z.string().uuid(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  senderAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional()
});

// Contact schemas
export const createContactSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['PHONE', 'ADDRESS', 'ENS']),
  value: z.string().min(1),
  linkedAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  notes: z.string().max(500).optional()
});

export const resolveEnsSchema = z.object({
  name: z.string().min(1)
});

// Cash-out schemas
export const initiateCashoutSchema = z.object({
  remitId: z.string().uuid(),
  method: z.enum(['upi', 'bank']),
  upiId: z.string().optional(),
  bankAcct: z.string().optional()
});

// Admin schemas
export const updateConfigSchema = z.object({
  feeBps: z.number().int().min(0).max(1000).optional(),
  fxBase: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  fxSpread: z.string().regex(/^\d+(\.\d{1,2})?$/).optional()
});

export const updateFeatureFlagSchema = z.object({
  key: z.string().min(1),
  value: z.any()
});

export const remitQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  min: z.string().optional(),
  max: z.string().optional(),
  flagged: z.string().optional()
});
