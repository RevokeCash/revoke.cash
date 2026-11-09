// The value rules of the label columns, which every label writer checks, and the pure precedence rules for labels and
// computed metadata. Browser-safe: no database or node imports.
import type { indexerSpenderChecks, indexerTokenMetadata } from '@revoke.cash/core/db/schema/indexer';
import type { labelsSpenders, labelsTokens } from '@revoke.cash/core/db/schema/labels';
import type { RiskFactor } from '@revoke.cash/core/risk';
import type { TokenStandard } from '@revoke.cash/core/tokens';
import { deduplicateArray, isNullish } from '@revoke.cash/core/utils';
import type { SpamReason } from '@revoke.cash/core/utils/errors';
import type { SpenderData } from '@revoke.cash/core/whois';
import type { Address } from 'viem';

// A labels.spenders row with this chain id applies to every chain id
export const ALL_CHAINS_CHAIN_ID = 0;

// The largest chain id that the integer chain_id columns hold. The store has no data for chains above it (Palm
// 11297108109 and 42 chains that only the whois registry has).
export const MAX_CHAIN_ID = 2_147_483_647;

// The largest decimals value that labels.tokens holds (tokens_decimals_range). Above 77 a uint256 cannot hold one whole
// token, and toFixed throws above 100 (utils/formatting.ts).
export const MAX_TOKEN_DECIMALS = 77;

// The longest labels.tokens symbol and logo URL
export const MAX_SYMBOL_LENGTH = 100;
export const MAX_LOGO_URL_LENGTH = 2_048;

// One labels.spenders row
export type SpenderLabelWithRole = typeof labelsSpenders.$inferSelect;

// What the app reads of a labels.spenders row: contract_role is only for the labels CLI
export type SpenderLabel = Omit<SpenderLabelWithRole, 'contractRole'>;

// One element of labels.spenders.risk_factors: a risk factor without its source, which is always 'whois'
export type SpenderLabelRiskFactor = SpenderLabel['riskFactors'][number];
export type SpenderRiskType = SpenderLabelRiskFactor['type'];

// One labels.tokens row
export type TokenLabel = typeof labelsTokens.$inferSelect;

// The label values that the token merge reads
type TokenLabelValues = Pick<TokenLabel, 'symbol' | 'decimals' | 'logoUrl' | 'isSpam'>;

// What revoke.cash's own spender checks computed
export type SpenderCheck = Pick<typeof indexerSpenderChecks.$inferSelect, 'name' | 'riskFactors' | 'enrichedAt'>;

// Everything the store holds for one spender on one chain
export interface SpenderRows {
  chainLabel?: SpenderLabel;
  allChainsLabel?: SpenderLabel;
  check?: SpenderCheck;
  exploitNames: string[];
  scamSnifferListed: boolean;
}

export interface MergedSpenderMetadata {
  name: string | null;
  riskFactors: RiskFactor[];
  enrichedAt: Date | null;
}

// What revoke.cash's own token checks computed (indexer.token_metadata)
export type ComputedTokenMetadata = Pick<
  typeof indexerTokenMetadata.$inferSelect,
  'symbol' | 'decimals' | 'totalSupply' | 'spamReason' | 'enrichmentError' | 'enrichedAt'
> & {
  // NOT NULL in token_metadata, but the union read in getCachedTokenMetadata types it as nullable
  tokenStandard: TokenStandard | null;
};

export interface MergedTokenMetadata {
  tokenAddress: Address;
  tokenStandard: TokenStandard | null;
  symbol: string | null;
  decimals: number | null;
  totalSupply: bigint | null;
  logoUrl: string | null;
  spamReason: SpamReason | null;
  enrichmentError: string | null;
  enrichedAt: Date | null;
}

// The /generated/tokens body: only set fields, never null
export interface PublicTokenLabel {
  symbol?: string;
  decimals?: number;
  logoURI?: string;
  isSpam?: boolean;
}

export const mergeSpenderRows = (rows: SpenderRows): MergedSpenderMetadata => {
  const riskFactors = deduplicateArray(
    [
      ...getCuratedRiskFactors(rows),
      ...(rows.check?.riskFactors ?? []),
      ...rows.exploitNames.map((exploitName) => ({ type: 'exploit', source: 'whois', data: exploitName })),
      ...(rows.scamSnifferListed ? [{ type: 'blocklist', source: 'scamsniffer' }] : []),
    ],
    getRiskFactorKey,
  );

  return {
    // People beat code
    name: rows.chainLabel?.name ?? rows.allChainsLabel?.name ?? rows.check?.name ?? null,
    riskFactors,
    enrichedAt: rows.check?.enrichedAt ?? null,
  };
};

export const mergeTokenMetadata = (
  tokenAddress: Address,
  computed: ComputedTokenMetadata | undefined,
  label: TokenLabelValues | undefined,
): MergedTokenMetadata => ({
  tokenAddress,
  tokenStandard: computed?.tokenStandard ?? null,
  symbol: label?.symbol ?? computed?.symbol ?? null,
  decimals: label?.decimals ?? computed?.decimals ?? null,
  totalSupply: computed?.totalSupply ?? null,
  logoUrl: label?.logoUrl ?? null,
  spamReason: getMergedSpamReason(computed, label),
  enrichmentError: computed?.enrichmentError ?? null,
  enrichedAt: getMergedEnrichedAt(computed, label),
});

// The /generated/spenders body: only set fields, never null. It passes the curated fields one by one, so the check and
// ScamSniffer data of a wider rows object never reach /generated.
export const toPublicSpenderLabel = ({
  chainLabel,
  allChainsLabel,
  exploitNames,
}: Pick<SpenderRows, 'chainLabel' | 'allChainsLabel' | 'exploitNames'>): SpenderData => {
  const { name, riskFactors } = mergeSpenderRows({
    chainLabel,
    allChainsLabel,
    exploitNames,
    scamSnifferListed: false,
  });

  return {
    ...(isNullish(name) ? {} : { name }),
    ...(riskFactors.length === 0 ? {} : { riskFactors }),
  };
};

export const toPublicTokenLabel = (label: TokenLabel): PublicTokenLabel => ({
  ...(isNullish(label.symbol) ? {} : { symbol: label.symbol }),
  ...(isNullish(label.decimals) ? {} : { decimals: label.decimals }),
  ...(isNullish(label.logoUrl) ? {} : { logoURI: label.logoUrl }),
  ...(isNullish(label.isSpam) ? {} : { isSpam: label.isSpam }),
});

// Takes the label rows of one address
export const splitSpenderLabels = (labels: SpenderLabel[]): Pick<SpenderRows, 'chainLabel' | 'allChainsLabel'> => {
  const allChainsLabels = labels.filter((label) => label.chainId === ALL_CHAINS_CHAIN_ID);
  const chainLabels = labels.filter((label) => label.chainId !== ALL_CHAINS_CHAIN_ID);

  if (allChainsLabels.length > 1 || chainLabels.length > 1) {
    throw new Error(`Expected at most one chain label and one all-chains label for one address, got ${labels.length}`);
  }

  return { chainLabel: chainLabels[0], allChainsLabel: allChainsLabels[0] };
};

// The chain id of one chain: an integer from 1 to MAX_CHAIN_ID (labels.spenders also holds ALL_CHAINS_CHAIN_ID)
export const isLabelChainId = (chainId: unknown): chainId is number => {
  return typeof chainId === 'number' && Number.isSafeInteger(chainId) && chainId > 0 && chainId <= MAX_CHAIN_ID;
};

export const isTokenDecimals = (decimals: unknown): decimals is number => {
  return typeof decimals === 'number' && Number.isInteger(decimals) && decimals >= 0 && decimals <= MAX_TOKEN_DECIMALS;
};

export const isTokenSymbol = (symbol: unknown): symbol is string => {
  if (typeof symbol !== 'string' || hasControlCharacter(symbol)) return false;
  return symbol.trim().length >= 1 && symbol.trim().length <= MAX_SYMBOL_LENGTH;
};

export const isTokenLogoUrl = (logoUrl: string): boolean => {
  return logoUrl.length <= MAX_LOGO_URL_LENGTH && !hasControlCharacter(logoUrl) && isHttpsUrl(logoUrl);
};

const getCuratedRiskFactors = (rows: Pick<SpenderRows, 'chainLabel' | 'allChainsLabel'>): RiskFactor[] => {
  const labelRiskFactors = [...(rows.chainLabel?.riskFactors ?? []), ...(rows.allChainsLabel?.riskFactors ?? [])];
  return labelRiskFactors.map(({ type, data }) => ({ type, source: 'whois', ...(data === undefined ? {} : { data }) }));
};

// The one dedupe key of risk factors, for the check write (enrichSpender) and the merged read
export const getRiskFactorKey = (riskFactor: RiskFactor): string => {
  return `${riskFactor.type}-${riskFactor.data}-${riskFactor.source}`;
};

// Any label row turns the spam heuristics off (presence allowlist), unless it says is_spam = true
const getMergedSpamReason = (
  computed: ComputedTokenMetadata | undefined,
  label: TokenLabelValues | undefined,
): SpamReason | null => {
  if (label?.isSpam === true) return 'whois';
  if (label) return null;
  return computed?.spamReason ?? null;
};

// A spam-flagged row has no symbol, decimals or total supply. When a label lifts the verdict, a null enrichedAt
// makes the next read re-check the token, and with the label the heuristics do not run again.
const getMergedEnrichedAt = (
  computed: ComputedTokenMetadata | undefined,
  label: TokenLabelValues | undefined,
): Date | null => {
  if (!computed) return null;
  if (label && label.isSpam !== true && !isNullish(computed.spamReason)) return null;
  return computed.enrichedAt;
};

const isHttpsUrl = (url: string): boolean => URL.parse(url)?.protocol === 'https:';

// U+0000 to U+001F. Postgres text rejects U+0000.
const hasControlCharacter = (text: string): boolean => {
  return Array.from(text).some((character) => character.charCodeAt(0) <= 0x1f);
};
