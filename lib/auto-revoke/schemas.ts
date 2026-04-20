import type { Hex } from 'viem';
import { z } from 'zod';
import {
  isAutoRevokeSupportedChain,
  STALE_APPROVAL_THRESHOLD_MAX_DAYS,
  STALE_APPROVAL_THRESHOLD_MIN_DAYS,
} from './config';

const supportedChainId = z.number().int().refine(isAutoRevokeSupportedChain, { message: 'Unsupported chain' });

const hexString = z
  .string()
  .regex(/^0x[0-9a-fA-F]+$/, 'Expected 0x-prefixed hex string')
  .transform((value) => value as Hex);

export const rulesDataSchema = z
  .object({
    riskDetectionEnabled: z.boolean(),
    riskSensitivity: z.enum(['exploits_only', 'high', 'medium']),
    staleApprovalEnabled: z.boolean(),
    staleApprovalThresholdDays: z
      .number()
      .int()
      .min(STALE_APPROVAL_THRESHOLD_MIN_DAYS)
      .max(STALE_APPROVAL_THRESHOLD_MAX_DAYS),
  })
  .strict()
  .partial();

export const grantPermissionBodySchema = z
  .object({
    chainId: supportedChainId,
    permissionContext: hexString,
  })
  .strict();

export const syncPermissionsBodySchema = z
  .object({
    permissions: z.array(grantPermissionBodySchema),
  })
  .strict();

export const rulesConfigBodySchema = z
  .object({
    subscriptionId: z.string().uuid().nullable(),
  })
  .strict();

// Route param schemas

export const chainIdRouteParamsSchema = z.object({
  chainId: z.coerce.number().pipe(supportedChainId),
});

export const subscriptionIdRouteParamsSchema = z.object({
  id: z.string().uuid(),
});
