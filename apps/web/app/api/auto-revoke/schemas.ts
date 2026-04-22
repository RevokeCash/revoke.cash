import {
  STALE_APPROVAL_THRESHOLD_MAX_DAYS,
  STALE_APPROVAL_THRESHOLD_MIN_DAYS,
} from '@revoke.cash/core/auto-revoke/config';
import { autoRevokeSupportedChainIdSchema, hexStringSchema } from '@revoke.cash/core/schemas';
import { z } from 'zod';

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
