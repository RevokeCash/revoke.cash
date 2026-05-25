import type { DocumentedChainId } from '@revoke.cash/core/chains';
import { getDb } from '@revoke.cash/core/db/client';
import { indexerEvents } from '@revoke.cash/core/db/schema/indexer';
import {
  ERC721_APPROVAL_FOR_ALL_TOPIC,
  ERC721_APPROVAL_TOPIC,
  ERC721_TRANSFER_TOPIC,
  PERMIT2_APPROVAL_TOPIC,
  PERMIT2_LOCKDOWN_TOPIC,
  PERMIT2_PERMIT_TOPIC,
} from '@revoke.cash/core/events';
import { addressToTopic } from '@revoke.cash/core/events/utils';
import { and, eq, gte, inArray, lte, type SQL, sql } from 'drizzle-orm';
import { type Address, getAddress, type Hex } from 'viem';
import { deduplicateArray } from '../utils';

// Get all token addresses with any allowance-relevant event for the user in a block range from the events cache database
// This is used to narrow down the set of tokens to recompute allowances for in the recompute path.
// Four sources, three different "where's the token" answers:
//   - Token-emitted approval/transfer events: token = `address` (the emitter).
//   - Permit2 Approval/Permit: token = topic2 (left-padded 32-byte indexed arg).
//   - Permit2 Lockdown: token = first ABI word of `data` (only `owner` is indexed; see
//     <https://github.com/Uniswap/permit2/blob/main/src/interfaces/IAllowanceTransfer.sol>).
export const findAffectedTokens = async (
  address: Address,
  chainId: DocumentedChainId,
  fromBlock: number,
  toBlock: number,
): Promise<Array<Address>> => {
  const userTopic = addressToTopic(address);
  const db = getDb();

  const tokenFromAddress = sql<string>`${indexerEvents.address}`;
  const tokenFromTopic2 = sql<string>`'0x' || substring(${indexerEvents.topic2} from 27 for 40)`;
  const tokenFromData = sql<string>`'0x' || substring(${indexerEvents.data} from 27 for 40)`;

  // Tokens user has Approval/ApprovalForAll history with — used to narrow Transfer events
  // below. Not range-scoped: a Transfer in the recompute window only matters if the user has
  // *ever* approved that token (otherwise the Transfer can't change allowance state).
  const approvedTokensSubquery = db
    .selectDistinct({ address: indexerEvents.address })
    .from(indexerEvents)
    .where(
      and(
        eq(indexerEvents.chainId, chainId),
        eq(indexerEvents.topic1, userTopic),
        inArray(indexerEvents.topic0, [ERC721_APPROVAL_TOPIC, ERC721_APPROVAL_FOR_ALL_TOPIC]),
      ),
    );

  const distinct = (tokenExpr: SQL<string>, topic0s: readonly Hex[], extraWhere?: SQL) =>
    db
      .selectDistinct({ token: tokenExpr })
      .from(indexerEvents)
      .where(
        and(
          eq(indexerEvents.chainId, chainId),
          eq(indexerEvents.topic1, userTopic),
          inArray(indexerEvents.topic0, topic0s),
          gte(indexerEvents.blockNumber, fromBlock),
          lte(indexerEvents.blockNumber, toBlock),
          extraWhere,
        ),
      );

  const rowsByQuery = await Promise.all([
    distinct(tokenFromAddress, [ERC721_APPROVAL_TOPIC, ERC721_APPROVAL_FOR_ALL_TOPIC]),
    distinct(tokenFromTopic2, [PERMIT2_APPROVAL_TOPIC, PERMIT2_PERMIT_TOPIC]),
    distinct(tokenFromAddress, [ERC721_TRANSFER_TOPIC], inArray(indexerEvents.address, approvedTokensSubquery)),
    distinct(tokenFromData, [PERMIT2_LOCKDOWN_TOPIC]),
  ]);

  return deduplicateArray(rowsByQuery.flat().map((row) => getAddress(row.token)));
};
