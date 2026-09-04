/**
 * Checks our hand-maintained chain data (lib/chains/index.ts) against chainid.network and the live web:
 *   - Reports every upstream change for our chains since the last run. chain-data-upstream.json holds
 *     the upstream values as of the last run, so only new upstream changes show up, not the places
 *     where our data deliberately differs from upstream.
 *   - Checks that every explorer and info URL of a supported chain still responds.
 *   - Prints a draft Chain entry for a chain id we do not support yet.
 *
 *   packages/core $ yarn check-chain-data               # upstream changes + dead URLs
 *   packages/core $ yarn check-chain-data --update      # accept the upstream changes into the snapshot
 *   packages/core $ yarn check-chain-data --chain 8453  # draft entry for a new chain
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CHAINS, getChainConfig } from '@revoke.cash/core/chains';
import type { Chain, NativeCurrency } from '@revoke.cash/core/chains/Chain';
import PQueue from 'p-queue';
import { z } from 'zod';

const UPSTREAM_URL = 'https://chainid.network/chains.json';
const SNAPSHOT_PATH = join(import.meta.dirname, 'chain-data-upstream.json');

const upstreamChainSchema = z.object({
  chainId: z.number(),
  name: z.string(),
  status: z.string().optional(),
  infoURL: z.string().optional(),
  nativeCurrency: z.object({ name: z.string(), symbol: z.string(), decimals: z.number() }),
  rpc: z.array(z.string()),
  explorers: z.array(z.object({ url: z.string() })).optional(),
});

type UpstreamChain = z.infer<typeof upstreamChainSchema>;

interface UpstreamChainData {
  name: string;
  status?: string;
  explorerUrl?: string;
  rpcUrl?: string;
  infoUrl?: string;
  nativeCurrency: NativeCurrency;
}

// null means the chain is not listed upstream
type Snapshot = Record<string, UpstreamChainData | null>;

const isPublicHttpsUrl = (url: string) => url.startsWith('https://') && !url.includes('${');

const label = (chain: Chain) => `${chain.getName()} (${chain.chainId})`;

const toUpstreamChainData = (chain: UpstreamChain | undefined): UpstreamChainData | null => {
  if (!chain) return null;

  return {
    name: chain.name,
    status: chain.status,
    explorerUrl: chain.explorers?.[0]?.url,
    rpcUrl: chain.rpc.find(isPublicHttpsUrl),
    infoUrl: chain.infoURL,
    nativeCurrency: chain.nativeCurrency,
  };
};

const fetchUpstream = async (): Promise<Map<number, UpstreamChain>> => {
  const response = await fetch(UPSTREAM_URL);
  const chains = z.array(upstreamChainSchema).parse(await response.json());
  return new Map(chains.map((chain) => [chain.chainId, chain]));
};

const readSnapshot = (): Snapshot | undefined => {
  if (!existsSync(SNAPSHOT_PATH)) return undefined;
  return JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8'));
};

const describeChanges = (chain: Chain, previous: UpstreamChainData | null, next: UpstreamChainData | null) => {
  if (previous === null && next === null) return [];
  if (previous === null) return [`${label(chain)}: now listed upstream`];
  if (next === null) return [`${label(chain)}: removed upstream`];

  const fields = Object.keys({ ...previous, ...next }) as Array<keyof UpstreamChainData>;
  return fields
    .filter((field) => JSON.stringify(previous[field]) !== JSON.stringify(next[field]))
    .map((field) => `${label(chain)}: ${field} ${JSON.stringify(previous[field])} -> ${JSON.stringify(next[field])}`);
};

const reportUpstreamChanges = (
  upstream: Map<number, UpstreamChain>,
  snapshot: Snapshot | undefined,
  update: boolean,
) => {
  const chains = Object.values(CHAINS);
  const nextSnapshot: Snapshot = Object.fromEntries(
    chains.map((chain) => [chain.chainId, toUpstreamChainData(upstream.get(chain.chainId))]),
  );

  if (!snapshot) {
    console.log('There is no snapshot yet, so upstream changes cannot be reported; run with --update to create one.');
  } else {
    const missing = chains.filter((chain) => snapshot[chain.chainId] === undefined);
    const changes = chains
      .filter((chain) => snapshot[chain.chainId] !== undefined)
      .flatMap((chain) => describeChanges(chain, snapshot[chain.chainId], nextSnapshot[chain.chainId]));

    if (changes.length === 0) console.log('No upstream changes since the last snapshot.');
    else console.log(`Upstream changes since the last snapshot:\n${changes.map((change) => `  ${change}`).join('\n')}`);
    if (missing.length > 0)
      console.log(`Not in the snapshot yet (run with --update): ${missing.map(label).join(', ')}`);
  }

  if (update) {
    writeFileSync(SNAPSHOT_PATH, `${JSON.stringify(nextSnapshot, null, 2)}\n`);
    console.log(`Snapshot written to ${SNAPSHOT_PATH}`);
  }
};

const checkUrl = async (url: string): Promise<string | undefined> => {
  try {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15_000) });
    // Bot protection answers 403 for automated requests, which still proves the host is alive
    if (response.status === 404 || response.status === 410 || response.status >= 500) return `HTTP ${response.status}`;
    return undefined;
  } catch (error) {
    // Network errors surface as a generic "fetch failed"; the cause code says whether the domain is gone or the host is down
    const cause = (error as { cause?: { code?: string } }).cause?.code;
    const message = error instanceof Error ? error.message : String(error);
    return cause ? `${message} (${cause})` : message;
  }
};

const reportDeadUrls = async () => {
  const queue = new PQueue({ concurrency: 10 });
  const checks = Object.values(CHAINS)
    .filter((chain) => chain.isSupported())
    .flatMap((chain) => [
      { chain, kind: 'explorer', url: chain.getExplorerUrl() },
      { chain, kind: 'info', url: chain.getInfoUrl() },
    ]);

  const results = await Promise.all(
    checks.map((check) => queue.add(async () => ({ ...check, failure: await checkUrl(check.url) }))),
  );

  const failures = results
    .flatMap((result) =>
      result?.failure ? [`${label(result.chain)}: ${result.kind} ${result.url}: ${result.failure}`] : [],
    )
    .sort();

  if (failures.length === 0) console.log('All explorer and info URLs respond.');
  else console.log(`URLs that do not respond:\n${failures.map((failure) => `  ${failure}`).join('\n')}`);
};

// Same rule as the keys in lib/chains/ids.ts: PascalCase of the display name
const toIdentifier = (name: string) => {
  const key = name
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
    .replace(/[^A-Za-z0-9_$]/g, '');
  return /^[0-9]/.test(key) ? `_${key}` : key;
};

const printDraftEntry = (upstream: Map<number, UpstreamChain>, chainId: number) => {
  const configured = getChainConfig(chainId);
  if (configured) {
    console.log(`Chain ${chainId} is already configured as ${configured.getName()}.`);
    return;
  }

  const chain = upstream.get(chainId);
  if (!chain) {
    console.log(`Chain ${chainId} is not listed on chainid.network; fill in the entry by hand.`);
    return;
  }

  const data = toUpstreamChainData(chain);
  const key = toIdentifier(chain.name);
  const slug = chain.name.toLowerCase().replace(/\s+/g, '-');
  const currency = chain.nativeCurrency;

  console.log(`// lib/chains/ids.ts\n  ${key}: ${chainId},\n`);
  console.log(`// lib/chains/index.ts
  [ChainId.${key}]: new Chain({
    type: SupportType.PROVIDER,
    chainId: ChainId.${key},
    name: '${chain.name}',
    nativeCurrency: { name: '${currency.name}', symbol: '${currency.symbol}', decimals: ${currency.decimals} },
    logoUrl: '/assets/images/vendor/chains/${slug}.svg',
    explorerUrl: '${data?.explorerUrl ?? 'FILL_IN'}',
    infoUrl: '${data?.infoUrl ?? 'FILL_IN'}',
    rpc: { main: '${data?.rpcUrl ?? 'FILL_IN'}' },
  }),`);
};

const main = async () => {
  const upstream = await fetchUpstream();
  const chainArgumentIndex = process.argv.indexOf('--chain');

  if (chainArgumentIndex !== -1) {
    const chainId = Number(process.argv[chainArgumentIndex + 1]);
    if (!Number.isInteger(chainId)) throw new Error('Pass a chain id after --chain');
    printDraftEntry(upstream, chainId);
    return;
  }

  reportUpstreamChanges(upstream, readSnapshot(), process.argv.includes('--update'));
  await reportDeadUrls();
};

main();
