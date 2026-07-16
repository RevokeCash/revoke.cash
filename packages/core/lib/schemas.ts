import { isAutoRevokeSupportedChain } from '@revoke.cash/core/auto-revoke/config';
import { isBackendSupportedChain, isSupportedChain } from '@revoke.cash/core/chains';
import { getAddress, type Hash, type Hex, isAddress, isHash, isHex } from 'viem';
import { z } from 'zod';

export const addressSchema = z
  .string()
  .refine((value) => isAddress(value, { strict: false }), { error: 'Invalid Ethereum address' })
  .transform((value) => getAddress(value));

export const hexStringSchema = z
  .string()
  .refine((value) => isHex(value), { error: 'Invalid hex string' })
  .transform((value) => value as Hex);

export const transactionHashSchema = z
  .string()
  .refine((value) => isHash(value), { error: 'Invalid transaction hash' })
  .transform((value) => value as Hash);

export const chainIdSchema = z.coerce.number().int().positive();

export const supportedChainIdSchema = chainIdSchema
  .refine(isSupportedChain, {
    error: 'Unsupported chain',
    params: { status: 404 },
  })
  .transform((value) => value);

export const backendSupportedChainIdSchema = supportedChainIdSchema.refine(isBackendSupportedChain, {
  error: 'Unsupported chain',
  params: { status: 404 },
});

export const autoRevokeSupportedChainIdSchema = chainIdSchema.refine(isAutoRevokeSupportedChain, {
  error: 'Unsupported chain',
  params: { status: 404 },
});
