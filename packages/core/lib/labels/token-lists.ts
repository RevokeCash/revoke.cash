// Server-only: the daily token-list importer. It writes symbol, decimals and logo of the labels.tokens rows that no CLI
// edit owns, from CoinGecko, the Uniswap list and OpenSea.
import { ChainId } from '@revoke.cash/core/chains/ids';
import { COINGECKO_API_BASE_URL, COINGECKO_API_KEY, OPENSEA_API_KEY } from '@revoke.cash/core/constants';
import { getTransactionalDb } from '@revoke.cash/core/db/client';
import ky from '@revoke.cash/core/ky';
import { isLabelChainId, isTokenDecimals, isTokenLogoUrl, isTokenSymbol } from '@revoke.cash/core/labels/merge';
import { importTokenLabels, type TokenListEntry } from '@revoke.cash/core/labels/tokens';
import { deduplicateArray, delay } from '@revoke.cash/core/utils';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import { mapAsyncSequential } from '@revoke.cash/core/utils/promises';
import { SECOND } from '@revoke.cash/core/utils/time';
import { HTTPError } from 'ky';
import { getAddress, isAddress, zeroAddress } from 'viem';

type TokenListSource = 'coingecko' | 'uniswap' | 'opensea';

// A failed fetch gives no entries from that source for that chain, and the other sources write as usual
interface TokenListFetchFailure {
  source: TokenListSource;
  chainId?: number;
  error: string;
}

interface TokenListEntries<TEntry = TokenListEntry> {
  entries: TEntry[];
  // Invalid entries, which never fail the run
  skipped: number;
  failedFetches: TokenListFetchFailure[];
}

interface TokenListsImportResult {
  candidates: number;
  skipped: number;
  changed: number;
  failedFetches: TokenListFetchFailure[];
}

// An OpenSea collection keeps its slug until the merge, which drops a contract that holds more than one collection
interface OpenSeaEntry extends TokenListEntry {
  collection: string;
}

// The entries of each source, in precedence order
interface TokenListCandidates {
  openSea: OpenSeaEntry[];
  coinGecko: TokenListEntry[];
  uniswap: TokenListEntry[];
}

interface CoinGeckoPlatform {
  id: string;
  chainId: number;
}

interface OpenSeaChain {
  chainId: number;
  chainSlug: string;
  maxPages?: number;
}

// The entry fields before validation
interface UncheckedEntry {
  chainId: unknown;
  address: unknown;
  symbol: unknown;
  decimals: number | null;
  logoUrl: unknown;
}

// Supported chains whose CoinGecko platform has no chain_identifier
const COINGECKO_PLATFORM_OVERRIDES: CoinGeckoPlatform[] = [
  { id: 'tempo', chainId: ChainId.Tempo },
  { id: 'bob-network', chainId: ChainId.BOB },
];
const COINGECKO_REQUEST_INTERVAL = 1 * SECOND;

const UNISWAP_TOKEN_LIST_URL = 'https://tokens.uniswap.org';

const OPENSEA_COLLECTIONS_URL = 'https://api.opensea.io/api/v2/collections';
const OPENSEA_PAGE_SIZE = 50;
const OPENSEA_REQUEST_INTERVAL = 550;
const OPENSEA_MAX_PAGES = 20;

// Literal chain ids, not ChainId names, because Zora (7777777) is not a supported chain. blast, immutable and bsc return
// no collections.
const OPENSEA_CHAINS: OpenSeaChain[] = [
  { chainId: 8453, chainSlug: 'base' },
  { chainId: 1, chainSlug: 'ethereum', maxPages: 200 },
  { chainId: 7777777, chainSlug: 'zora' },
  { chainId: 42161, chainSlug: 'arbitrum' },
  { chainId: 1329, chainSlug: 'sei' },
  { chainId: 43114, chainSlug: 'avalanche' },
  { chainId: 137, chainSlug: 'polygon' },
  { chainId: 10, chainSlug: 'optimism' },
  { chainId: 33139, chainSlug: 'ape_chain' },
  { chainId: 747, chainSlug: 'flow' },
  { chainId: 1868, chainSlug: 'soneium' },
  { chainId: 2020, chainSlug: 'ronin' },
  { chainId: 80094, chainSlug: 'bera_chain' },
  { chainId: 360, chainSlug: 'shape' },
  { chainId: 130, chainSlug: 'unichain' },
  { chainId: 2741, chainSlug: 'abstract' },
  { chainId: 999, chainSlug: 'hyperevm' },
  { chainId: 5031, chainSlug: 'somnia' },
  { chainId: 143, chainSlug: 'monad' },
  { chainId: 4326, chainSlug: 'megaeth' },
];

// Many lists use 0xeee...e for the native token
const NATIVE_TOKEN_PLACEHOLDER_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

const USDT_LOGO_URL =
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png';
const WETH_LOGO_URL =
  'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png';

const LOGO_URL_OVERRIDES = new Map([
  ['USDT', USDT_LOGO_URL],
  ['USDTE', USDT_LOGO_URL],
  ['BSC-USD', USDT_LOGO_URL],
  ['WETH', WETH_LOGO_URL],
]);

// All writes are in one transaction at the end, so an error or a restart mid-run writes nothing. The pool stays open,
// because the long-lived indexer reuses it. A missing API key or a failed /asset_platforms call throws before any list
// is fetched.
export const importTokenLists = async (): Promise<TokenListsImportResult> => {
  if (!COINGECKO_API_KEY) throw new Error('COINGECKO_API_KEY is not set');
  if (!OPENSEA_API_KEY) throw new Error('OPENSEA_API_KEY is not set');

  const coinGeckoPlatforms = await fetchCoinGeckoPlatforms();

  const [openSea, coinGecko, uniswap] = await Promise.all([
    getOpenSeaEntries(),
    getCoinGeckoEntries(coinGeckoPlatforms),
    getUniswapEntries(),
  ]);

  const entries = mergeTokenListEntries({
    openSea: openSea.entries,
    coinGecko: coinGecko.entries,
    uniswap: uniswap.entries,
  });

  const changed = await getTransactionalDb().transaction((transaction) => importTokenLabels(transaction, entries));

  return {
    candidates: entries.length,
    skipped: openSea.skipped + coinGecko.skipped + uniswap.skipped,
    changed,
    failedFetches: [...openSea.failedFetches, ...coinGecko.failedFetches, ...uniswap.failedFetches],
  };
};

const fetchCoinGeckoPlatforms = async (): Promise<CoinGeckoPlatform[]> => {
  const platforms = await ky
    .get(`${COINGECKO_API_BASE_URL}/asset_platforms`, { headers: { 'x-cg-pro-api-key': COINGECKO_API_KEY }, retry: 0 })
    .json<unknown>();

  if (!Array.isArray(platforms)) {
    throw new Error(`CoinGecko returned no asset platforms: ${JSON.stringify(platforms)?.slice(0, 200)}`);
  }

  // A platform whose chain id does not fit the chain_id columns (strato) is not fetched
  const platformsWithChainId = platforms.flatMap((platform) => {
    if (!isPlainObject(platform) || typeof platform.id !== 'string') return [];
    if (!isLabelChainId(platform.chain_identifier)) return [];
    return [{ id: platform.id, chainId: platform.chain_identifier }];
  });

  return deduplicateArray([...platformsWithChainId, ...COINGECKO_PLATFORM_OVERRIDES], (platform) => platform.id);
};

// Sequential and 1 s apart, next to the price queue on the same key
const getCoinGeckoEntries = async (platforms: CoinGeckoPlatform[]): Promise<TokenListEntries> => {
  const results = await mapAsyncSequential(platforms, async ({ id, chainId }) => {
    try {
      const tokens = await fetchCoinGeckoTokens(id);
      return toTokenListEntries(tokens, (token) => toCoinGeckoEntry(chainId, token));
    } catch (error) {
      return toFailedFetch('coingecko', chainId, error);
    }
  });

  return combineTokenListEntries(results);
};

// A 404 'Invalid asset platform ID' means that the platform has no token list
const fetchCoinGeckoTokens = async (platformId: string): Promise<unknown[]> => {
  await delay(COINGECKO_REQUEST_INTERVAL);

  try {
    const tokenList = await ky
      .get(`${COINGECKO_API_BASE_URL}/token_lists/${platformId}/all.json`, {
        headers: { 'x-cg-pro-api-key': COINGECKO_API_KEY },
        retry: 0,
      })
      .json<unknown>();

    return getArrayField(tokenList, 'tokens');
  } catch (error) {
    if (isUnknownPlatformError(error)) return [];
    throw error;
  }
};

// Only this body means 'no list'. Any other 404 (a moved endpoint, for example) is a failed fetch with a warn line.
const isUnknownPlatformError = (error: unknown): boolean => {
  if (!(error instanceof HTTPError) || error.response.status !== 404) return false;
  return JSON.stringify(error.data ?? '').includes('Invalid asset platform ID');
};

const getUniswapEntries = async (): Promise<TokenListEntries> => {
  try {
    const tokenList = await ky.get(UNISWAP_TOKEN_LIST_URL, { retry: 0 }).json<unknown>();
    return toTokenListEntries(getArrayField(tokenList, 'tokens'), toUniswapEntry);
  } catch (error) {
    return toFailedFetch('uniswap', undefined, error);
  }
};

const getOpenSeaEntries = async (): Promise<TokenListEntries<OpenSeaEntry>> => {
  const results = await mapAsyncSequential(
    OPENSEA_CHAINS,
    async ({ chainId, chainSlug, maxPages = OPENSEA_MAX_PAGES }) => {
      try {
        const collections = await fetchOpenSeaCollections(chainSlug, maxPages);
        return toTokenListEntries(collections, (collection) => toOpenSeaEntry(chainId, chainSlug, collection));
      } catch (error) {
        return toFailedFetch('opensea', chainId, error);
      }
    },
  );

  return combineTokenListEntries(results);
};

// Pages in market cap order until `next` is missing; any failed page fails the chain
const fetchOpenSeaCollections = async (chainSlug: string, pagesLeft: number, next?: string): Promise<unknown[]> => {
  await delay(OPENSEA_REQUEST_INTERVAL);

  const page = await ky
    .get(OPENSEA_COLLECTIONS_URL, {
      headers: { 'x-api-key': OPENSEA_API_KEY },
      searchParams: { chain: chainSlug, limit: OPENSEA_PAGE_SIZE, include_hidden: false, order_by: 'market_cap', next },
      retry: 0,
    })
    .json<unknown>();

  const collections = getArrayField(page, 'collections');
  const nextCursor = isPlainObject(page) && typeof page.next === 'string' && page.next !== '' ? page.next : undefined;
  if (nextCursor === undefined || pagesLeft <= 1) return collections;

  return [...collections, ...(await fetchOpenSeaCollections(chainSlug, pagesLeft - 1, nextCursor))];
};

const getArrayField = (body: unknown, key: 'tokens' | 'collections'): unknown[] => {
  const value = isPlainObject(body) ? body[key] : undefined;
  if (!Array.isArray(value)) throw new Error(`The response has no ${key} array`);
  return value;
};

const toTokenListEntries = <TEntry>(
  items: unknown[],
  toEntry: (item: unknown) => TEntry | undefined,
): TokenListEntries<TEntry> => {
  const entries = items.map((item) => toEntry(item)).filter((entry): entry is TEntry => entry !== undefined);
  return { entries, skipped: items.length - entries.length, failedFetches: [] };
};

const toFailedFetch = (
  source: TokenListSource,
  chainId: number | undefined,
  error: unknown,
): TokenListEntries<never> => {
  return { entries: [], skipped: 0, failedFetches: [{ source, chainId, error: parseErrorMessage(error) }] };
};

const combineTokenListEntries = <TEntry>(results: TokenListEntries<TEntry>[]): TokenListEntries<TEntry> => ({
  entries: results.flatMap((result) => result.entries),
  skipped: results.reduce((total, result) => total + result.skipped, 0),
  failedFetches: results.flatMap((result) => result.failedFetches),
});

// One entry per chain and address, taken whole from one source: OpenSea, then CoinGecko, then Uniswap. The first entry
// for a key wins, inside one source too, which also keeps every INSERT free of duplicate keys. A contract that holds
// more than one OpenSea collection (Art Blocks) gets no OpenSea entry.
const mergeTokenListEntries = ({ openSea, coinGecko, uniswap }: TokenListCandidates): TokenListEntry[] => {
  const sharedContractKeys = getSharedContractKeys(openSea);
  const singleCollectionEntries = openSea.filter((entry) => !sharedContractKeys.has(getEntryKey(entry)));

  return deduplicateArray([...singleCollectionEntries, ...coinGecko, ...uniswap], getEntryKey);
};

// The same collection on two pages is still one collection
const getSharedContractKeys = (entries: OpenSeaEntry[]): Set<string> => {
  const collectionsByKey = entries.reduce((collections, entry) => {
    const key = getEntryKey(entry);
    return collections.set(key, (collections.get(key) ?? new Set<string>()).add(entry.collection));
  }, new Map<string, Set<string>>());

  return new Set([...collectionsByKey.entries()].filter(([, collections]) => collections.size > 1).map(([key]) => key));
};

const getEntryKey = (entry: TokenListEntry): string => `${entry.chainId}:${entry.address.toLowerCase()}`;

// The chain id comes from the platform. An entry's own chainId is checked only when it is a number (every entry of the
// tempo and bob-network lists has chainId null).
const toCoinGeckoEntry = (platformChainId: number, token: unknown): TokenListEntry | undefined => {
  if (!isPlainObject(token)) return undefined;
  if (typeof token.chainId === 'number' && token.chainId !== platformChainId) return undefined;
  return toTokenListsStandardEntry(platformChainId, token);
};

const toUniswapEntry = (token: unknown): TokenListEntry | undefined => {
  if (!isPlainObject(token)) return undefined;
  return toTokenListsStandardEntry(token.chainId, token);
};

// CoinGecko and Uniswap use the Token Lists format. An entry without valid decimals is skipped, not written with NULL,
// so a lower-precedence source can fill the key. There is no coercion: '6' is skipped.
const toTokenListsStandardEntry = (chainId: unknown, token: Record<string, unknown>): TokenListEntry | undefined => {
  if (!isTokenDecimals(token.decimals)) return undefined;

  return toEntry({
    chainId,
    address: token.address,
    symbol: token.symbol,
    decimals: token.decimals,
    logoUrl: token.logoURI,
  });
};

// OpenSea collections have no decimals field, so their rows get NULL decimals
const toOpenSeaEntry = (chainId: number, chainSlug: string, collection: unknown): OpenSeaEntry | undefined => {
  if (!isPlainObject(collection) || typeof collection.collection !== 'string') return undefined;

  const collectionSlug = collection.collection;
  const contracts: unknown[] = Array.isArray(collection.contracts) ? collection.contracts : [];
  const primaryContract = contracts.filter(isPlainObject).find((contract) => contract.chain === chainSlug);

  const entry = toEntry({
    chainId,
    address: primaryContract?.address,
    symbol: collection.name,
    decimals: null,
    logoUrl: collection.image_url,
  });

  return entry && { ...entry, collection: collectionSlug };
};

// Symbol and logo are both required (whois parity), so a source entry without a logo is skipped even when its symbol
// has a logo override. Symbols are kept as the source gives them.
const toEntry = ({ chainId, address, symbol, decimals, logoUrl }: UncheckedEntry): TokenListEntry | undefined => {
  if (!isLabelChainId(chainId) || !isTokenAddress(address) || !isTokenSymbol(symbol)) return undefined;
  if (typeof logoUrl !== 'string' || logoUrl === '') return undefined;

  const normalisedLogoUrl = normaliseLogoUrl(symbol, logoUrl);
  if (!isTokenLogoUrl(normalisedLogoUrl)) return undefined;

  return { chainId, address: getAddress(address), symbol, decimals, logoUrl: normalisedLogoUrl };
};

// Byte-for-byte the logo rules of whois sanitiseTokenData (scripts/utils/index.ts), not improved, so baseline rows do
// not change. A string replace changes only the first match.
const normaliseLogoUrl = (symbol: string, logoUrl: string): string => {
  return (
    LOGO_URL_OVERRIDES.get(symbol) ??
    logoUrl
      .replace('/thumb/', '/small/')
      .replace('w=500', 'w=32')
      .replace('ipfs://', 'https://ipfs.io/ipfs/')
      .replace(/\.png\?.+/i, '.png')
      .replace(/\.jpg\?.+/i, '.jpg')
  );
};

const isTokenAddress = (address: unknown): address is string => {
  if (typeof address !== 'string' || !isAddress(address, { strict: false })) return false;
  return address.toLowerCase() !== zeroAddress && address.toLowerCase() !== NATIVE_TOKEN_PLACEHOLDER_ADDRESS;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};
