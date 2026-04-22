import { contracts, getSmartAccountsEnvironment } from '@metamask/smart-accounts-kit';
import {
  decodeDelegations,
  hashDelegation,
  SIGNABLE_DELEGATION_TYPED_DATA,
  toDelegationStruct,
} from '@metamask/smart-accounts-kit/utils';
import { and, eq, getTableColumns, inArray, isNull, notInArray, sql } from 'drizzle-orm';
import { type DatabaseTransaction, getDb, getTransactionalDb } from 'lib/db/client';
import { autoRevokePermissions } from 'lib/db/schema/auto-revoke';
import { premiumSubscriptionAddresses } from 'lib/db/schema/premium';
import { deduplicateArray } from 'lib/utils';
import { createViemPublicClientForChain } from 'lib/utils/chains';
import { filterAsync } from 'lib/utils/promises';
import { SECOND } from 'lib/utils/time';
import { type Address, getAddress, type Hex, recoverTypedDataAddress } from 'viem';
import { type AutoRevokeSupportedChainId, PERMISSION_EXPIRY_SECONDS, REVOKE_SESSION_ACCOUNT_ADDRESS } from './config';
import type { AutoRevokePermission, WalletPermissionResult } from './types';

export const getAutoRevokePermissionsByAddress = async (address: Address): Promise<AutoRevokePermission[]> => {
  const db = getDb();
  const normalizedAddress = address.toLowerCase();

  const rows = await db.query.autoRevokePermissions.findMany({
    where: and(eq(autoRevokePermissions.address, normalizedAddress), isNull(autoRevokePermissions.revokedAt)),
  });

  return rows.map(mapPermission);
};

export const getAutoRevokePermissionsBySubscription = async (
  subscriptionId: string,
): Promise<AutoRevokePermission[]> => {
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

export const saveAutoRevokePermission = async (
  item: Omit<AutoRevokePermission, 'isActive'>,
): Promise<{ id: string }> => {
  const { address, ...rest } = item;
  const [result] = await saveAutoRevokePermissionBatch(address, [rest]);
  return result;
};

export const saveAutoRevokePermissionBatch = async (
  address: Address,
  items: Array<Omit<AutoRevokePermission, 'address' | 'isActive'>>,
): Promise<Array<{ id: string }>> => {
  if (items.length === 0) return [];

  const db = getTransactionalDb();
  return db.transaction((trx) => applyPermissionBatch(trx, address.toLowerCase(), items));
};

export const syncAutoRevokePermissions = async (
  address: Address,
  items: Array<Omit<AutoRevokePermission, 'address' | 'isActive'>>,
): Promise<Array<{ id: string }>> => {
  const db = getTransactionalDb();
  const normalizedAddress = address.toLowerCase();
  const syncedChainIds = items.map((item) => item.chainId);

  return db.transaction(async (trx) => {
    const results = await applyPermissionBatch(trx, normalizedAddress, items);

    // Revoke any active DB permissions for chains not present in the synced set.
    await trx
      .update(autoRevokePermissions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(autoRevokePermissions.address, normalizedAddress),
          isNull(autoRevokePermissions.revokedAt),
          syncedChainIds.length > 0 ? notInArray(autoRevokePermissions.chainId, syncedChainIds) : undefined,
        ),
      );

    return results;
  });
};

export const revokeAutoRevokePermission = async (address: Address, chainId: number): Promise<void> => {
  const db = getDb();
  const normalizedAddress = address.toLowerCase();

  await db
    .update(autoRevokePermissions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(autoRevokePermissions.address, normalizedAddress),
        eq(autoRevokePermissions.chainId, chainId),
        isNull(autoRevokePermissions.revokedAt),
      ),
    );
};

export const buildAutoRevokePermissionRequest = (chainId: number) => {
  if (!REVOKE_SESSION_ACCOUNT_ADDRESS) throw new Error('Session account address is not configured');

  const expiry = Math.floor(Date.now() / 1000) + PERMISSION_EXPIRY_SECONDS;

  return {
    chainId,
    expiry,
    to: REVOKE_SESSION_ACCOUNT_ADDRESS as Address,
    permission: {
      type: 'erc20-token-revocation' as const,
      data: { justification: 'Permission to revoke ERC20 token allowances on your behalf' },
      isAdjustmentAllowed: false,
    },
  };
};

export const findActivePermission = async (
  permissions: WalletPermissionResult[],
  delegator: Address,
): Promise<WalletPermissionResult | null> => {
  const activePermissions = await filterActivePermissions(permissions, delegator);
  return activePermissions[0] ?? null;
};

export const filterActivePermissions = async (
  permissions: WalletPermissionResult[],
  delegator: Address,
): Promise<WalletPermissionResult[]> => {
  const validRecentFirstPermissions = permissions
    .filter((permission) => isValidAutoRevokePermission(permission, delegator))
    .toReversed();

  try {
    return await filterAsync(validRecentFirstPermissions, isPermissionEnabledOnChain);
  } catch (error) {
    console.error('Failed to verify on-chain permission status, falling back to unverified permissions:', error);
    return validRecentFirstPermissions;
  }
};

export const isValidAutoRevokePermission = (permission: WalletPermissionResult, delegator: Address): boolean => {
  if (permission.permission?.type !== 'erc20-token-revocation') return false;
  if (permission.to?.toLowerCase() !== REVOKE_SESSION_ACCOUNT_ADDRESS?.toLowerCase()) return false;

  const decoded = decodeDelegations(permission.context)?.[0];
  if (!decoded) return false;

  return decoded.delegator.toLowerCase() === delegator.toLowerCase();
};

export const isPermissionEnabledOnChain = async (permission: WalletPermissionResult): Promise<boolean> => {
  const decodedPermission = decodeDelegations(permission.context)?.[0];
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
  normalizedAddress: string,
  items: Array<Omit<AutoRevokePermission, 'address' | 'isActive'>>,
): Promise<Array<{ id: string }>> => {
  if (items.length === 0) return [];

  // Dedupe by chainId. The DB enforces at most one active permission per (address, chainId),
  // so submitting two items for the same chain would violate the partial unique index.
  // Deduping by chainId also subsumes context-level dedup because two items with the same
  // context necessarily share a chainId (the chain is encoded in the delegation caveats).
  const uniqueItems = deduplicateArray(items, (item) => String(item.chainId));
  const chainIds = uniqueItems.map((item) => item.chainId);
  const contexts = uniqueItems.map((item) => item.permissionContext);

  // Revoke any OTHER active permissions for this address on the touched chains.
  // Rows whose context matches one of our batch items are preserved and refreshed by the upsert below.
  await trx
    .update(autoRevokePermissions)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(autoRevokePermissions.address, normalizedAddress),
        isNull(autoRevokePermissions.revokedAt),
        inArray(autoRevokePermissions.chainId, chainIds),
        notInArray(autoRevokePermissions.permissionContext, contexts),
      ),
    );

  // Insert the batch, or reactivate/refresh any rows we've seen the context for before.
  return trx
    .insert(autoRevokePermissions)
    .values(
      uniqueItems.map((item) => ({
        address: normalizedAddress,
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
    .returning({ id: autoRevokePermissions.id });
};

export const resolvePermissionRecord = async (
  authenticatedAddress: Address,
  input: { permissionContext: Hex; chainId: AutoRevokeSupportedChainId },
): Promise<Omit<AutoRevokePermission, 'isActive'>> => {
  const normalizedAddress = authenticatedAddress.toLowerCase();

  const decodedPermission = decodeDelegations(input.permissionContext)?.[0];
  if (!decodedPermission) throw new Error('Failed to decode permission context');

  if (decodedPermission.delegator.toLowerCase() !== normalizedAddress) {
    throw new Error('Permission context does not belong to the authenticated address');
  }
  if (decodedPermission.delegate.toLowerCase() !== REVOKE_SESSION_ACCOUNT_ADDRESS?.toLowerCase()) {
    throw new Error('Permission is not granted to the Revoke session account');
  }

  const delegationManager = getSmartAccountsEnvironment(input.chainId).DelegationManager;

  // Cryptographic chain binding: the signature was produced over an EIP-712 domain that includes
  // chainId + DelegationManager. If either doesn't match, the recovered signer won't equal the delegator.
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

  if (recoveredSigner.toLowerCase() !== normalizedAddress) {
    throw new Error('Permission signature does not match the claimed chain');
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
  const fallbackExpiry = new Date(Date.now() + PERMISSION_EXPIRY_SECONDS * SECOND).toISOString();

  const timestampEnforcer = getSmartAccountsEnvironment(chainId).caveatEnforcers.TimestampEnforcer?.toLowerCase();
  if (!timestampEnforcer) return fallbackExpiry;

  const timestampCaveat = caveats.find((caveat) => caveat.enforcer.toLowerCase() === timestampEnforcer);
  if (!timestampCaveat || timestampCaveat.terms.length !== 2 + 64) return fallbackExpiry;

  const beforeThreshold = Number(`0x${timestampCaveat.terms.slice(2 + 32, 2 + 64)}`);
  if (beforeThreshold === 0) return fallbackExpiry;
  return new Date(beforeThreshold * SECOND).toISOString();
};

const mapPermission = (row: typeof autoRevokePermissions.$inferSelect): AutoRevokePermission => ({
  address: getAddress(row.address),
  chainId: row.chainId,
  permissionContext: row.permissionContext as Hex,
  delegationManager: getAddress(row.delegationManager),
  expiresAt: row.expiresAt.toISOString(),
  isActive: !row.revokedAt && row.expiresAt.getTime() > Date.now(),
});
