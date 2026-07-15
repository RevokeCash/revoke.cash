import { contracts, getSmartAccountsEnvironment } from '@metamask/smart-accounts-kit';
import type {
  PermissionRequestParameter,
  RequestExecutionPermissionsReturnType,
} from '@metamask/smart-accounts-kit/actions';
import {
  decodeDelegations,
  hashDelegation,
  SIGNABLE_DELEGATION_TYPED_DATA,
  toDelegationStruct,
} from '@metamask/smart-accounts-kit/utils';
import { createViemPublicClientForChain } from '@revoke.cash/core/chains';
import { AUTO_REVOKE_DELEGATION_ADDRESS } from '@revoke.cash/core/constants';
import { type DatabaseTransaction, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import { autoRevokePermissions } from '@revoke.cash/core/db/schema/auto-revoke';
import { premiumSubscriptionAddresses } from '@revoke.cash/core/db/schema/premium';
import { acquireAdvisoryLock } from '@revoke.cash/core/db/utils';
import { scheduleEventsReindex } from '@revoke.cash/core/indexer/register';
import { deduplicateArray } from '@revoke.cash/core/utils';
import { filterAsync } from '@revoke.cash/core/utils/promises';
import { SECOND } from '@revoke.cash/core/utils/time';
import { and, eq, getTableColumns, gt, inArray, isNull, notInArray, sql } from 'drizzle-orm';
import { type Address, type Hex, isAddressEqual, recoverTypedDataAddress } from 'viem';
import { ApiError } from '../utils/errors';
import { type AutoRevokeSupportedChainId, PERMISSION_EXPIRY_SECONDS } from './config';

export interface AutoRevokePermission {
  address: Address;
  chainId: number;
  permissionContext: Hex;
  delegationManager: Address;
  expiresAt: string;
  isActive: boolean;
}

export type PermissionRecord = typeof autoRevokePermissions.$inferSelect;

type WalletPermissionResult = RequestExecutionPermissionsReturnType[number];

const AUTO_REVOKE_PERMISSION_TYPE = 'token-approval-revocation';

export const getPermissionsByAddress = async (address: Address): Promise<AutoRevokePermission[]> => {
  const db = getDb();

  const rows = await db.query.autoRevokePermissions.findMany({
    where: and(eq(autoRevokePermissions.address, address), isNull(autoRevokePermissions.revokedAt)),
  });

  return rows.map(mapPermission);
};

export const getPermissionsBySubscription = async (subscriptionId: string): Promise<AutoRevokePermission[]> => {
  const db = getDb();

  const rows = await db
    .select(getTableColumns(autoRevokePermissions))
    .from(autoRevokePermissions)
    .innerJoin(premiumSubscriptionAddresses, eq(premiumSubscriptionAddresses.address, autoRevokePermissions.address))
    .where(
      and(eq(premiumSubscriptionAddresses.subscriptionId, subscriptionId), isNull(autoRevokePermissions.revokedAt)),
    );

  return rows.map(mapPermission);
};

export const findActivePermission = async (address: Address, chainId: number): Promise<PermissionRecord | null> => {
  const permission = await getDb().query.autoRevokePermissions.findFirst({
    where: and(
      eq(autoRevokePermissions.address, address),
      eq(autoRevokePermissions.chainId, chainId),
      isNull(autoRevokePermissions.revokedAt),
      gt(autoRevokePermissions.expiresAt, new Date()),
    ),
  });

  return permission ?? null;
};

export const getPermissionById = async (permissionId: string): Promise<PermissionRecord | null> => {
  const permission = await getDb().query.autoRevokePermissions.findFirst({
    where: eq(autoRevokePermissions.id, permissionId),
  });

  return permission ?? null;
};

export const savePermission = async (item: Omit<AutoRevokePermission, 'isActive'>): Promise<{ id: string }> => {
  const { address, ...rest } = item;
  const [result] = await getTransactionalDb().transaction((trx) => applyPermissionBatch(trx, address, [rest]));

  await scheduleReindexForGrantedChains(address, [result.chainId]);
  return { id: result.id };
};

const scheduleReindexForGrantedChains = async (address: Address, chainIds: number[]): Promise<void> => {
  try {
    await scheduleEventsReindex(getDb(), [address], chainIds);
  } catch (error) {
    console.error('Failed to schedule events reindex after permission grant:', error);
  }
};

export const syncPermissions = async (
  address: Address,
  items: Array<Omit<AutoRevokePermission, 'address' | 'isActive'>>,
): Promise<Array<Pick<PermissionRecord, 'id' | 'address' | 'chainId'>>> => {
  const db = getTransactionalDb();
  const syncedChainIds = items.map((item) => item.chainId);

  const candidates = await getDb().query.autoRevokePermissions.findMany({
    where: and(
      eq(autoRevokePermissions.address, address),
      isNull(autoRevokePermissions.revokedAt),
      syncedChainIds.length > 0 ? notInArray(autoRevokePermissions.chainId, syncedChainIds) : undefined,
    ),
  });

  const permissionIdsToRevoke = (await filterAsync(candidates, isPermissionDisabledOrExpired)).map((row) => row.id);

  const results = await db.transaction(async (trx) => {
    const batch = await applyPermissionBatch(trx, address, items);

    if (permissionIdsToRevoke.length > 0) {
      await trx
        .update(autoRevokePermissions)
        .set({ revokedAt: new Date() })
        .where(and(inArray(autoRevokePermissions.id, permissionIdsToRevoke), isNull(autoRevokePermissions.revokedAt)));
    }

    return batch;
  });

  const grantedChainIds = results.map((result) => result.chainId);
  await scheduleReindexForGrantedChains(address, grantedChainIds);
  return results;
};

const isPermissionDisabledOrExpired = async (row: PermissionRecord): Promise<boolean> => {
  if (row.expiresAt.getTime() <= Date.now()) return true;

  try {
    const isEnabled = await isPermissionEnabledOnChain({
      chainId: row.chainId,
      delegationManager: row.delegationManager,
      permissionContext: row.permissionContext as Hex,
    });

    return !isEnabled;
  } catch (error) {
    console.error('Failed to verify onchain permission status, keeping permission active:', error);
    return false;
  }
};

export const revokePermission = async (address: Address, chainId: number): Promise<void> => {
  const db = getDb();

  await db
    .update(autoRevokePermissions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(autoRevokePermissions.address, address),
        eq(autoRevokePermissions.chainId, chainId),
        isNull(autoRevokePermissions.revokedAt),
      ),
    );
};

export const markPermissionRevoked = async (permissionId: string): Promise<void> => {
  await getDb()
    .update(autoRevokePermissions)
    .set({ revokedAt: new Date() })
    .where(and(eq(autoRevokePermissions.id, permissionId), isNull(autoRevokePermissions.revokedAt)));
};

export const buildPermissionRequest = (chainId: number): PermissionRequestParameter => {
  const expiry = Math.floor(Date.now() / 1000) + PERMISSION_EXPIRY_SECONDS;

  return {
    chainId,
    expiry,
    to: AUTO_REVOKE_DELEGATION_ADDRESS,
    permission: {
      type: AUTO_REVOKE_PERMISSION_TYPE,
      data: {
        erc20Approve: true,
        erc721Approve: true,
        erc721SetApprovalForAll: true,
        permit2Approve: true,
        permit2Lockdown: true,
        permit2InvalidateNonces: true,
        justification: 'Permission to automatically revoke token approvals based on your settings.',
      },
      isAdjustmentAllowed: false,
    },
  };
};

export const filterActivePermissions = async (
  permissions: WalletPermissionResult[],
  delegator: Address,
): Promise<WalletPermissionResult[]> => {
  const validRecentFirstPermissions = permissions
    .filter((permission) => isValidAutoRevokePermission(permission, delegator))
    .reverse();

  try {
    return await filterAsync(validRecentFirstPermissions, (permission) =>
      isPermissionEnabledOnChain({
        chainId: permission.chainId,
        delegationManager: permission.delegationManager,
        permissionContext: permission.context,
      }),
    );
  } catch (error) {
    console.error('Failed to verify on-chain permission status, falling back to unverified permissions:', error);
    return validRecentFirstPermissions;
  }
};

export const isValidAutoRevokePermission = (permission: WalletPermissionResult, delegator: Address): boolean => {
  if (permission.permission?.type !== AUTO_REVOKE_PERMISSION_TYPE) return false;
  if (permission.permission.data.erc20Approve !== true) return false;
  if (permission.permission.data.erc721Approve !== true) return false;
  if (permission.permission.data.erc721SetApprovalForAll !== true) return false;
  if (permission.permission.data.permit2Approve !== true) return false;
  if (!permission.to || !isAddressEqual(permission.to, AUTO_REVOKE_DELEGATION_ADDRESS)) return false;

  const decoded = decodeDelegations(permission.context)?.[0];
  if (!decoded) return false;

  return isAddressEqual(decoded.delegator, delegator);
};

export const isPermissionEnabledOnChain = async (
  permission: Pick<AutoRevokePermission, 'chainId' | 'delegationManager' | 'permissionContext'>,
): Promise<boolean> => {
  const decodedPermission = decodeDelegations(permission.permissionContext)?.[0];
  if (!decodedPermission) return false;

  const publicClient = createViemPublicClientForChain(permission.chainId);
  const permissionHash = hashDelegation(decodedPermission);

  const isDisabled = await contracts.DelegationManager.read.disabledDelegations({
    client: publicClient,
    contractAddress: permission.delegationManager,
    delegationHash: permissionHash,
  });

  return !isDisabled;
};

const applyPermissionBatch = async (
  trx: DatabaseTransaction,
  address: Address,
  items: Array<Omit<AutoRevokePermission, 'address' | 'isActive'>>,
): Promise<Array<Pick<PermissionRecord, 'id' | 'address' | 'chainId'>>> => {
  if (items.length === 0) return [];

  await acquireAdvisoryLock(trx, `auto_revoke_permissions:${address.toLowerCase()}`);

  const uniqueItems = deduplicateArray(items, (item) => String(item.chainId));
  const chainIds = uniqueItems.map((item) => item.chainId);
  const contexts = uniqueItems.map((item) => item.permissionContext);

  // Revoke any OTHER active permissions for this address on the touched chains.
  await trx
    .update(autoRevokePermissions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(autoRevokePermissions.address, address),
        isNull(autoRevokePermissions.revokedAt),
        inArray(autoRevokePermissions.chainId, chainIds),
        notInArray(autoRevokePermissions.permissionContext, contexts),
      ),
    );

  // Insert the batch, or reactivate/refresh any rows we've seen the context for before.
  const permissions = await trx
    .insert(autoRevokePermissions)
    .values(
      uniqueItems.map((item) => ({
        address,
        chainId: item.chainId,
        permissionContext: item.permissionContext,
        delegationManager: item.delegationManager,
        expiresAt: new Date(item.expiresAt),
      })),
    )
    .onConflictDoUpdate({
      target: autoRevokePermissions.permissionContext,
      set: { revokedAt: null, expiresAt: sql`excluded.expires_at` },
    })
    .returning({
      id: autoRevokePermissions.id,
      address: autoRevokePermissions.address,
      chainId: autoRevokePermissions.chainId,
    });

  return permissions;
};

export const resolvePermissionRecord = async (
  authenticatedAddress: Address,
  input: { permissionContext: Hex; chainId: AutoRevokeSupportedChainId },
): Promise<Omit<AutoRevokePermission, 'isActive'>> => {
  const decodedPermission = decodeDelegations(input.permissionContext)?.[0];
  if (!decodedPermission) throw new ApiError(400, 'Failed to decode permission context');

  if (!isAddressEqual(decodedPermission.delegator, authenticatedAddress)) {
    throw new ApiError(403, 'Permission context does not belong to the authenticated address');
  }
  if (!isAddressEqual(decodedPermission.delegate, AUTO_REVOKE_DELEGATION_ADDRESS)) {
    throw new ApiError(400, 'Permission is not granted to the Revoke session account');
  }

  const delegationManager = getSmartAccountsEnvironment(input.chainId).DelegationManager;

  const recoveredSigner = await recoverTypedDataAddress({
    domain: {
      name: 'DelegationManager',
      version: '1',
      chainId: input.chainId,
      verifyingContract: delegationManager,
    },
    types: SIGNABLE_DELEGATION_TYPED_DATA,
    primaryType: 'Delegation',
    message: toDelegationStruct({ ...decodedPermission, signature: '0x' }),
    signature: decodedPermission.signature,
  });

  if (!isAddressEqual(recoveredSigner, authenticatedAddress)) {
    throw new ApiError(400, 'Permission signature does not match the claimed chain');
  }

  const expiresAt = extractExpiryFromCaveats(decodedPermission.caveats, input.chainId);

  return {
    address: authenticatedAddress,
    chainId: input.chainId,
    permissionContext: input.permissionContext,
    delegationManager,
    expiresAt,
  };
};

// We want to extract the expiry from the on-chain permission context so we know it is valid.
const extractExpiryFromCaveats = (caveats: ReadonlyArray<{ enforcer: Hex; terms: Hex }>, chainId: number): string => {
  const timestampEnforcer = getSmartAccountsEnvironment(chainId).caveatEnforcers.TimestampEnforcer?.toLowerCase();
  if (!timestampEnforcer) throw new ApiError(400, 'Timestamp enforcer is not configured for this chain');

  const timestampCaveat = caveats.find((caveat) => caveat.enforcer.toLowerCase() === timestampEnforcer);
  if (!timestampCaveat || timestampCaveat.terms.length !== 2 + 64) {
    throw new ApiError(400, 'Permission expiry caveat is missing or invalid');
  }

  const beforeThreshold = Number(`0x${timestampCaveat.terms.slice(2 + 32, 2 + 64)}`);
  if (beforeThreshold === 0) throw new ApiError(400, 'Permission expiry caveat is missing or invalid');
  return new Date(beforeThreshold * SECOND).toISOString();
};

const mapPermission = (row: PermissionRecord): AutoRevokePermission => ({
  address: row.address,
  chainId: row.chainId,
  permissionContext: row.permissionContext as Hex,
  delegationManager: row.delegationManager,
  expiresAt: row.expiresAt.toISOString(),
  isActive: !row.revokedAt && row.expiresAt.getTime() > Date.now(),
});
