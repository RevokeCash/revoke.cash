// Server-only (node:crypto): the ScamSniffer blocklist sync and the address hash that the spender read uses.
import { createHash } from 'node:crypto';
import { SCAMSNIFFER_API_KEY } from '@revoke.cash/core/constants';
import { getTransactionalDb } from '@revoke.cash/core/db/client';
import { labelsScamSnifferBlocklist } from '@revoke.cash/core/db/schema/labels';
import ky from '@revoke.cash/core/ky';
import { chunkArray, deduplicateArray } from '@revoke.cash/core/utils';
import { eq } from 'drizzle-orm';
import type { Address } from 'viem';

const ADDRESS_HASH_PATTERN = /^[0-9a-f]{32}$/;

// Replaces the rows that the sync owns (false_positive = false). On any error it writes nothing.
export const syncScamSnifferBlocklist = async (): Promise<{ received: number }> => {
  if (!SCAMSNIFFER_API_KEY) throw new Error('SCAMSNIFFER_API_KEY is not set');

  const blocklist = await ky
    .get('https://lookup-api.scamsniffer.io/v1/blocklist/address', { headers: { 'x-api-key': SCAMSNIFFER_API_KEY } })
    .json<unknown>();

  const addressHashes = parseScamSnifferBlocklist(blocklist);

  await getTransactionalDb().transaction(async (transaction) => {
    await transaction.delete(labelsScamSnifferBlocklist).where(eq(labelsScamSnifferBlocklist.falsePositive, false));

    // ON CONFLICT DO NOTHING: a false-positive row always wins
    for (const chunk of chunkArray(addressHashes, 1_000)) {
      await transaction
        .insert(labelsScamSnifferBlocklist)
        .values(chunk.map((addressHash) => ({ addressHash })))
        .onConflictDoNothing();
    }
  });

  return { received: addressHashes.length };
};

// This is also the auth check: a missing or invalid API key returns HTTP 200 with an error object
const parseScamSnifferBlocklist = (json: unknown): string[] => {
  if (!Array.isArray(json) || json.length === 0) {
    throw new Error(`ScamSniffer returned no address hashes: ${JSON.stringify(json)?.slice(0, 200)}`);
  }

  const addressHashes = json.map((entry) => {
    if (typeof entry !== 'string' || !ADDRESS_HASH_PATTERN.test(entry.toLowerCase())) {
      throw new Error(`ScamSniffer returned an invalid address hash: ${JSON.stringify(entry).slice(0, 100)}`);
    }

    return entry.toLowerCase();
  });

  return deduplicateArray(addressHashes);
};

// md5('revokecash:' + lowercase address), as the ScamSniffer API delivers it
export const scamSnifferAddressHash = (address: Address): string => {
  return createHash('md5').update(`revokecash:${address.toLowerCase()}`).digest('hex');
};
