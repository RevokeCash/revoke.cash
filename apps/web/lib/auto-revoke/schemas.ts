import { chainIdSchema, hexStringSchema } from 'lib/api/schemas';
import { z } from 'zod';
import {
  isAutoRevokeSupportedChain,
  STALE_APPROVAL_THRESHOLD_MAX_DAYS,
  STALE_APPROVAL_THRESHOLD_MIN_DAYS,
} from './config';

export const autoRevokeSupportedChainIdSchema = chainIdSchema.refine(isAutoRevokeSupportedChain, {
  message: 'Unsupported chain',
  params: { status: 404 },
});

export const rulesDataBodySchema = z
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
    chainId: autoRevokeSupportedChainIdSchema,
    permissionContext: hexStringSchema,
  })
  .strict();

export const syncPermissionsBodySchema = z
  .object({
    permissions: z.array(grantPermissionBodySchema),
  })
  .strict();
