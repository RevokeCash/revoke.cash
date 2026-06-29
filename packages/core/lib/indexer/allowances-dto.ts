import { ERC20_ABI, ERC721_ABI } from '@revoke.cash/core/abis';
import type { AllowancePayload, TokenAllowanceData } from '@revoke.cash/core/allowances';
import type { indexerTokenMetadata } from '@revoke.cash/core/db/schema/indexer';
import type { ApprovalTokenEvent, Enriched, EnrichedTokenEvent } from '@revoke.cash/core/events';
import { type SpenderMetadataRow, serializeSpenderMetadata } from '@revoke.cash/core/indexer/spender-metadata';
import type { TokenMetadata } from '@revoke.cash/core/tokens';
import type { Address, PublicClient } from 'viem';
import type { CachedAllowanceRow } from './allowances';

// Wire format for per address+chain read, includes allowances and events. Bigints use custom encoding,
// and the DTOs need to be deserialised to include ABIs and public clients. Balances are loaded separately.
export interface CachedAddressDataDto {
  state: {
    checkedAt: string | null;
    computedToBlock: number | null;
  };
  allowances: CachedAllowanceDto[];
  events: CachedTokenEventDto[];
}

export interface CachedAllowanceDto {
  tokenAddress: Address;
  isErc721: boolean;
  metadata: TokenMetadata;
  payload: AllowancePayload;
}

export type CachedTokenEventDto = Enriched<ApprovalTokenEvent>;

export interface DeserializedCachedAddressData {
  state: CachedAddressDataDto['state'];
  allowances: TokenAllowanceData[];
  events: EnrichedTokenEvent[];
}

interface DeserializationContext {
  owner: Address;
  chainId: number;
  publicClient: PublicClient;
}

type TokenMetadataRow = typeof indexerTokenMetadata.$inferSelect;

export const serializeMetadata = (metadata: TokenMetadataRow): TokenMetadata => ({
  symbol: metadata.symbol ?? metadata.tokenAddress,
  decimals: metadata.decimals ?? undefined,
  totalSupply: metadata.totalSupply ?? undefined,
  icon: metadata.iconUrl ?? undefined,
});

export const serializeAllowanceFromRow = (
  row: CachedAllowanceRow,
  metadata: TokenMetadataRow,
  spenderMetadata?: SpenderMetadataRow,
): CachedAllowanceDto => ({
  tokenAddress: row.tokenAddress,
  isErc721: metadata.tokenStandard === 'erc721',
  metadata: serializeMetadata(metadata),
  payload: serializeAllowancePayloadFromRow(row, spenderMetadata),
});

export const serializeApprovalEvent = (
  event: ApprovalTokenEvent,
  metadata: TokenMetadataRow,
  spenderMetadata?: SpenderMetadataRow,
): CachedTokenEventDto =>
  ({
    ...event,
    payload: { ...event.payload, spenderData: serializeSpenderMetadata(spenderMetadata) },
    time: { ...event.time, timestamp: event.time.timestamp! },
    metadata: serializeMetadata(metadata),
  }) as CachedTokenEventDto;

export const deserializeCachedAddressData = (
  dto: CachedAddressDataDto,
  context: DeserializationContext,
): DeserializedCachedAddressData => ({
  state: dto.state,
  allowances: dto.allowances.map((allowance) => deserializeAllowance(allowance, context)),
  events: dto.events,
});

const serializeAllowancePayloadFromRow = (
  row: CachedAllowanceRow,
  spenderMetadata?: SpenderMetadataRow,
): AllowancePayload => {
  return {
    type: row.allowanceType,
    spender: row.spenderAddress,
    spenderData: serializeSpenderMetadata(spenderMetadata),
    amount: row.amount ?? undefined,
    tokenId: row.tokenId ?? undefined,
    permit2Address: row.permit2Address ?? undefined,
    expiration: row.expiration ?? undefined,
    lastUpdated: {
      blockNumber: row.lastUpdatedBlock,
      transactionHash: row.lastUpdatedTxHash,
      timestamp: row.lastUpdatedTimestamp,
    },
  } as AllowancePayload;
};

const deserializeAllowance = (
  dto: CachedAllowanceDto,
  { publicClient, chainId, owner }: DeserializationContext,
): TokenAllowanceData => {
  const abi = dto.isErc721 ? ERC721_ABI : ERC20_ABI;
  const contract = { address: dto.tokenAddress, abi, publicClient } as TokenAllowanceData['contract'];

  return {
    contract,
    chainId,
    owner,
    metadata: dto.metadata,
    payload: dto.payload,
  };
};
