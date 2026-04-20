import { type DocumentedChainId, isBackendSupportedChain, isSupportedChain } from 'lib/utils/chains';
import { type Address, getAddress, type Hash, type Hex, isAddress } from 'viem';
import { z } from 'zod';

export const addressSchema = z
  .string()
  .refine((value) => isAddress(value, { strict: false }), { message: 'Invalid Ethereum address' })
  .transform((value) => getAddress(value) as Address);

export const hexStringSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]+$/, 'Expected 0x-prefixed hex string')
  .transform((value) => value as Hex);

export const transactionHashSchema = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/, 'Expected 32-byte transaction hash')
  .transform((value) => value as Hash);

export const chainIdSchema = z.coerce.number().int().positive();

export const supportedChainIdSchema = chainIdSchema
  .refine(isSupportedChain, {
    message: 'Unsupported chain',
    params: { status: 404 },
  })
  .transform((value) => value as DocumentedChainId);

export const backendSupportedChainIdSchema = supportedChainIdSchema.refine(isBackendSupportedChain, {
  message: 'Unsupported chain',
  params: { status: 404 },
});

export const uuidSchema = z.string().uuid();
