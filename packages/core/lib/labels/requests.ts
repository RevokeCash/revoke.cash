// Server-only: the request log of the label routes (labels.requests)
import { getDb } from '@revoke.cash/core/db/client';
import { type labelsAddressTypeEnum, labelsRequests } from '@revoke.cash/core/db/schema/labels';
import type { Address } from 'viem';

export type LabelAddressType = (typeof labelsAddressTypeEnum.enumValues)[number];

// Best-effort: the routes run it in after(), once the response is sent, so a failed insert is only logged
export const recordLabelRequest = async (
  addressType: LabelAddressType,
  chainId: number,
  address: Address,
): Promise<void> => {
  try {
    await getDb().insert(labelsRequests).values({ addressType, chainId, address });
  } catch (error) {
    console.error(`Failed to record a ${addressType} label request:`, error);
  }
};
