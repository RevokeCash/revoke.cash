/**
 * The labels CLI, the only writer of labels.spenders, labels.exploits and labels.exploit_addresses, and of every
 * labels.tokens row with edited_at set. Its plan and write logic is in this folder; the label reads that it shares with
 * the app are in packages/core/lib/labels.
 *
 * Every write is validated first, then it prints its plan and asks `Apply to <host>? [y/N]`. On yes it writes the
 * change and its audit.events row in one transaction, so either both commit or nothing does. There is no undo
 * command: run `set` again with the `before` values that `get` shows, or restore the clone file from git and run
 * `exploit set` again.
 *
 * Run from the repo root as `yarn labels <command>` (see USAGE).
 */
import { createInterface } from 'node:readline/promises';
import { inspect, parseArgs } from 'node:util';
import type {
  ExploitAuditValues,
  SpenderLabelAuditValues,
  TokenLabelAuditValues,
} from '@revoke.cash/core/audit/actions';
import { insertAuditEvent } from '@revoke.cash/core/audit/events';
import { type DocumentedChainId, getChainConfig, getChainName } from '@revoke.cash/core/chains';
import { type DatabaseTransaction, getDb, getTransactionalDb } from '@revoke.cash/core/db/client';
import { auditEvents } from '@revoke.cash/core/db/schema/audit';
import { indexerSpenderChecks } from '@revoke.cash/core/db/schema/indexer';
import {
  labelsExploitAddresses,
  labelsExploits,
  labelsScamSnifferBlocklist,
  labelsSpenders,
  SPENDER_RISK_TYPES,
} from '@revoke.cash/core/db/schema/labels';
import type { Exploit } from '@revoke.cash/core/exploits';
import { scheduleEventsReindex } from '@revoke.cash/core/indexer/register';
import { getCachedSpenderMetadata } from '@revoke.cash/core/indexer/spender-metadata';
import { getCachedTokenMetadata } from '@revoke.cash/core/indexer/token-metadata';
import {
  ALL_CHAINS_CHAIN_ID,
  isLabelChainId,
  isTokenDecimals,
  isTokenLogoUrl,
  isTokenSymbol,
  MAX_CHAIN_ID,
  MAX_LOGO_URL_LENGTH,
  MAX_SYMBOL_LENGTH,
  MAX_TOKEN_DECIMALS,
  type SpenderLabel,
  type SpenderLabelRiskFactor,
  type SpenderLabelWithRole,
  type SpenderRiskType,
  type TokenLabel,
} from '@revoke.cash/core/labels/merge';
import { scamSnifferAddressHash } from '@revoke.cash/core/labels/scamsniffer';
import { getTokenLabel } from '@revoke.cash/core/labels/tokens';
import type { RiskFactor } from '@revoke.cash/core/risk';
import type { AddressOnChain } from '@revoke.cash/core/types';
import { deduplicateArray } from '@revoke.cash/core/utils';
import { mapAsyncSequential } from '@revoke.cash/core/utils/promises';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { type Address, getAddress, isAddress } from 'viem';
import {
  EXPLOIT_LIST_CLONE_PATH,
  type ExploitListClone,
  readExploitListClone,
  writeCanonicalExploitList,
} from './approval-exploit-list';
import {
  applyExploitChanges,
  type ExploitChange,
  type ExploitChangePlan,
  findAffectedUltimateWallets,
  getChangedExploitFields,
  planExploitChanges,
} from './exploit-changes';
import { countAffectedWallets } from './impact';
import { deleteSpenderLabel, setSpenderLabel, toStoredRiskFactors } from './spenders';
import { deleteTokenLabel, editTokenLabel, type TokenLabelFields } from './tokens';

const USAGE = `Usage (from the repo root):
  yarn labels get <chainId> <address>
  yarn labels spender set <chainId|all> <address> [--name <name>|none] [--contract-role <role>|none]
                          [--risk <type>[=<data>]]... [--risk none] --reason <reason>
  yarn labels spender delete <chainId|all> <address> --reason <reason>
  yarn labels token set <chainId> <address> [--symbol <symbol>] [--decimals <0-${MAX_TOKEN_DECIMALS}>] [--logo-url <url>]
                        [--spam true|false|none] [--note <note>] --reason <reason>
  yarn labels token delete <chainId> <address> --reason <reason>
  yarn labels exploit set --reason <reason>

  get          read-only: the merged spender and token views, the rows of every label table and the last 10
               audit events of the address
  all          chain id 0: the spender label applies on every chain
  --contract-role
               what the contract does in the project, e.g. 'Swap Router'. For our own understanding: only this CLI
               and the admin audit log show it.
  --risk       one risk factor per --risk: a type (deprecated, unsafe or blocklist), or a type and its data as
               type=data. Together they replace the whole set. A named exploit goes through exploit set.
  none         clears the field (for every option above that takes a value)
  --reason     required for every write: the issue URL, the pull request or the evidence
  exploit set  applies every exploits/<slug>.json of the approval-exploit-list clone and deletes every database
               slug without a file. Clone: ${EXPLOIT_LIST_CLONE_PATH}`;

const OPTIONS = {
  reason: { type: 'string' },
  name: { type: 'string' },
  'contract-role': { type: 'string' },
  risk: { type: 'string', multiple: true },
  symbol: { type: 'string' },
  decimals: { type: 'string' },
  'logo-url': { type: 'string' },
  spam: { type: 'string' },
  note: { type: 'string' },
  help: { type: 'boolean', short: 'h' },
} as const;

type OptionName = keyof typeof OPTIONS;

const COMMAND_OPTIONS = {
  get: [],
  'spender set': ['name', 'contract-role', 'risk', 'reason'],
  'spender delete': ['reason'],
  'token set': ['symbol', 'decimals', 'logo-url', 'spam', 'note', 'reason'],
  'token delete': ['reason'],
  'exploit set': ['reason'],
} as const satisfies Record<string, readonly OptionName[]>;

type CommandKind = keyof typeof COMMAND_OPTIONS;

// The value that clears a field
const NONE = 'none';

// 'exploit' is only for the imported whois factors that have no exploit name. A new exploit goes through
// `exploit set`, so the urgent auto-revoke lane never comes from one keystroke.
const EDITABLE_RISK_TYPES = SPENDER_RISK_TYPES.filter((riskType) => riskType !== 'exploit');

const RECENT_AUDIT_EVENT_COUNT = 10;
const MAX_PRINTED_ADDRESSES = 50;

const TOKEN_COLUMNS = [
  ['symbol', 'symbol'],
  ['decimals', 'decimals'],
  ['logoUrl', 'logo_url'],
  ['isSpam', 'is_spam'],
  ['note', 'note'],
] as const satisfies ReadonlyArray<readonly [keyof TokenLabelAuditValues, string]>;

// The values of a token that has no labels.tokens row
const EMPTY_TOKEN_VALUES: TokenLabelAuditValues = {
  symbol: null,
  decimals: null,
  logoUrl: null,
  isSpam: null,
  note: null,
};

const SPENDER_COLUMNS = [
  ['name', 'name'],
  ['contractRole', 'contract_role'],
  ['riskFactors', 'risk_factors'],
] as const satisfies ReadonlyArray<readonly [keyof SpenderLabelAuditValues, string]>;

interface WriteOptions {
  reason: string;
  actorAddress: Address;
}

type Command =
  | ({ kind: 'get' } & AddressOnChain)
  | ({
      kind: 'spender set';
      spenderName?: string | null;
      contractRole?: string | null;
      riskFactors?: SpenderLabelRiskFactor[];
    } & AddressOnChain &
      WriteOptions)
  | ({ kind: 'spender delete' } & AddressOnChain & WriteOptions)
  | ({ kind: 'token set'; fields: TokenLabelFields } & AddressOnChain & WriteOptions)
  | ({ kind: 'token delete' } & AddressOnChain & WriteOptions)
  | ({ kind: 'exploit set' } & WriteOptions);

type CommandOf<TKind extends CommandKind> = Extract<Command, { kind: TKind }>;

// What a write prints before the prompt and runs after a yes
interface WritePlan {
  hasChanges: boolean;
  write: (transaction: DatabaseTransaction) => Promise<void>;
}

const main = async (): Promise<boolean> => {
  // Every argument is checked before the first query
  const command = parseCommand();
  const databaseHost = getDatabaseHost();
  console.log(`Database host: ${databaseHost}`);

  switch (command.kind) {
    case 'get':
      return printAddressLabels(command);
    case 'spender set':
      return applyWritePlan(databaseHost, await planSpenderSet(command));
    case 'spender delete':
      return applyWritePlan(databaseHost, await planSpenderDelete(command));
    case 'token set':
      return applyWritePlan(databaseHost, await planTokenSet(command));
    case 'token delete':
      return applyWritePlan(databaseHost, await planTokenDelete(command));
    case 'exploit set':
      return setExploits(command, databaseHost);
  }
};

const printAddressLabels = async ({ chainId, address }: CommandOf<'get'>): Promise<boolean> => {
  const addressHash = scamSnifferAddressHash(address);

  const [
    spenderMetadata,
    tokenMetadata,
    spenderLabels,
    spenderChecks,
    tokenLabel,
    exploitMemberships,
    scamSnifferRows,
    auditRows,
  ] = await Promise.all([
    getCachedSpenderMetadata(chainId, [address]),
    getCachedTokenMetadata(chainId as DocumentedChainId, [address]),
    getDb()
      .select()
      .from(labelsSpenders)
      .where(and(inArray(labelsSpenders.chainId, [chainId, ALL_CHAINS_CHAIN_ID]), eq(labelsSpenders.address, address)))
      .orderBy(desc(labelsSpenders.chainId)),
    getDb()
      .select()
      .from(indexerSpenderChecks)
      .where(and(eq(indexerSpenderChecks.chainId, chainId), eq(indexerSpenderChecks.spenderAddress, address))),
    getTokenLabel(chainId, address),
    getDb()
      .select({
        chainId: labelsExploitAddresses.chainId,
        slug: labelsExploits.slug,
        name: labelsExploits.name,
        fixed: labelsExploits.fixed,
      })
      .from(labelsExploitAddresses)
      .innerJoin(labelsExploits, eq(labelsExploits.slug, labelsExploitAddresses.slug))
      .where(eq(labelsExploitAddresses.address, address))
      .orderBy(asc(labelsExploitAddresses.chainId), asc(labelsExploits.slug)),
    getDb().select().from(labelsScamSnifferBlocklist).where(eq(labelsScamSnifferBlocklist.addressHash, addressHash)),
    getDb()
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.targetAddress, address))
      .orderBy(desc(auditEvents.createdAt))
      .limit(RECENT_AUDIT_EVENT_COUNT),
  ]);

  console.log(`Address ${address} on ${formatChain(chainId)}`);
  printSection('Merged spender view (getCachedSpenderMetadata)', spenderMetadata.get(address));
  printSection('Merged token view (getCachedTokenMetadata)', tokenMetadata.get(address));
  printSection('labels.spenders rows (this chain and chain id 0)', spenderLabels);
  printSection('indexer.spender_checks row', spenderChecks[0]);
  printSection('labels.tokens row', tokenLabel);
  printSection('labels.exploit_addresses memberships (every chain)', exploitMemberships);
  printSection(`labels.scamsniffer_blocklist row (hash ${addressHash})`, scamSnifferRows[0]);
  printSection(`audit.events (the last ${RECENT_AUDIT_EVENT_COUNT} for this address)`, auditRows);
  console.log(`\nExploit history: git -C ${EXPLOIT_LIST_CLONE_PATH} log -S ${address}`);

  return true;
};

// Only the passed fields change. --risk replaces the whole set.
const planSpenderSet = async (command: CommandOf<'spender set'>): Promise<WritePlan> => {
  const { chainId, address } = command;
  const before = await getSpenderLabel(chainId, address);

  const after: SpenderLabelWithRole = {
    chainId,
    address,
    name: command.spenderName === undefined ? (before?.name ?? null) : command.spenderName,
    contractRole: command.contractRole === undefined ? (before?.contractRole ?? null) : command.contractRole,
    riskFactors: command.riskFactors ?? before?.riskFactors ?? [],
  };

  // spenders_name_or_risk
  if (after.name === null && after.riskFactors.length === 0) {
    throw new Error('A spender label needs a name or a risk factor. Use `spender delete` to remove the row.');
  }

  await printSpenderPlan(chainId, address, before, after);

  return {
    hasChanges: !before || !haveSameSpenderValues(before, after),
    write: async (transaction) => {
      await setSpenderLabel(transaction, after);
      await insertSpenderAuditEvent(transaction, command, before, after);
    },
  };
};

const planSpenderDelete = async (command: CommandOf<'spender delete'>): Promise<WritePlan> => {
  const { chainId, address } = command;
  const before = await getSpenderLabel(chainId, address);
  if (!before) throw new Error(`labels.spenders has no row for ${address} on ${formatChain(chainId)}`);

  await printSpenderPlan(chainId, address, before, undefined);

  return {
    hasChanges: true,
    write: async (transaction) => {
      await deleteSpenderLabel(transaction, chainId, address);
      await insertSpenderAuditEvent(transaction, command, before, undefined);
    },
  };
};

// Writes only the passed columns plus edited_at, which takes the row away from the daily importer
const planTokenSet = async (command: CommandOf<'token set'>): Promise<WritePlan> => {
  const { chainId, address, fields } = command;
  const beforeLabel = await getTokenLabel(chainId, address);
  const before = beforeLabel ? toTokenValues(beforeLabel) : undefined;
  const after: TokenLabelAuditValues = { ...(before ?? EMPTY_TOKEN_VALUES), ...fields };

  // tokens_not_empty
  if (after.symbol === null && after.decimals === null && after.logoUrl === null && after.isSpam === null) {
    throw new Error(
      'A token label needs a symbol, decimals, a logo URL or a spam flag. Use `token delete` to remove the row.',
    );
  }

  await printTokenPlan(chainId, address, beforeLabel, after);
  console.log('The importer no longer updates this row.');

  return {
    // A row that the importer owns changes owner even when its values stay the same
    hasChanges: !before || !haveSameTokenValues(before, after) || beforeLabel?.editedAt === null,
    write: async (transaction) => {
      await editTokenLabel(transaction, chainId, address, fields, after);
      await insertTokenAuditEvent(transaction, command, before, after);
    },
  };
};

const planTokenDelete = async (command: CommandOf<'token delete'>): Promise<WritePlan> => {
  const { chainId, address } = command;
  const beforeLabel = await getTokenLabel(chainId, address);
  if (!beforeLabel) throw new Error(`labels.tokens has no row for ${address} on ${formatChain(chainId)}`);
  const before = toTokenValues(beforeLabel);

  await printTokenPlan(chainId, address, beforeLabel, undefined);
  console.log('The next import re-creates this row if a source lists the token. Use `--spam true` to suppress it.');

  return {
    hasChanges: true,
    write: async (transaction) => {
      await deleteTokenLabel(transaction, chainId, address);
      await insertTokenAuditEvent(transaction, command, before, undefined);
    },
  };
};

// Applies the approval-exploit-list clone one way into labels.exploits and labels.exploit_addresses
const setExploits = async (command: CommandOf<'exploit set'>, databaseHost: string): Promise<boolean> => {
  const clone = await readExploitListClone();
  printExploitListClone(clone);

  const plan = await planExploitChanges(clone.exploits);
  printExploitPlan(plan);
  printUnknownChainWarning(plan);

  // The write schedules a scan of these wallets, so auto-revoke evaluates them against the new rows within minutes
  // instead of at their next hourly scan
  const ultimateWallets = await findAffectedUltimateWallets(
    plan.changes.flatMap((change) => (change.after && !change.after.fixed ? change.after.addresses : [])),
  );
  const ultimateWalletCount = new Set(ultimateWallets.map(({ address }) => address)).size;
  console.log(
    `\nUltimate wallets with an allowance to a planned non-fixed address on an auto-revoke chain: ` +
      `${formatCount(ultimateWalletCount)} (${formatCount(ultimateWallets.length)} wallet and chain pairs). ` +
      'The write schedules a scan of each pair.',
  );

  const written = await applyWritePlan(databaseHost, {
    hasChanges: plan.changes.length > 0,
    write: (transaction) => writeExploitChanges(transaction, command, plan, ultimateWallets),
  });
  if (!written) return false;

  // After the commit, and never undoing it: today's canonical form of the clone
  const rewrittenPaths = await writeCanonicalExploitList(clone);
  rewrittenPaths.forEach((path) => {
    console.log(`Rewrote ${path} in the canonical form`);
  });

  if (plan.changes.length === 0) return true;

  console.log(
    '\nRisk applies now. The English pages update within 15 minutes. Translations are optional ' +
      '(apps/web/content/<locale>/exploits). Commit and push ../approval-exploit-list.',
  );

  if (ultimateWallets.length > 0) {
    console.log(
      `The indexer scans the ${formatCount(ultimateWallets.length)} affected wallet and chain pairs at its next ` +
        'minute, and auto-revoke evaluates them after their scans.',
    );
  }

  return true;
};

const writeExploitChanges = async (
  transaction: DatabaseTransaction,
  command: CommandOf<'exploit set'>,
  plan: ExploitChangePlan,
  ultimateWallets: AddressOnChain[],
): Promise<void> => {
  await applyExploitChanges(transaction, plan);
  await scheduleWalletScans(transaction, ultimateWallets);

  // An exploit spans chains, so its audit rows have no target address and no chain id
  await mapAsyncSequential(plan.changes, (change) =>
    insertAuditEvent(transaction, {
      action: 'admin_exploit_changed',
      actorAddress: command.actorAddress,
      details: {
        slug: change.slug,
        reason: command.reason,
        before: toExploitAuditValues(change.before),
        after: toExploitAuditValues(change.after),
      },
    }),
  );
};

// Sets next_run_at to now in the same transaction as the exploit rows, so the scans always run against the database
// that holds them. The scan recomputes the allowances, and the evaluator then reads the new exploit rows.
const scheduleWalletScans = async (transaction: DatabaseTransaction, wallets: AddressOnChain[]): Promise<void> => {
  const chainIds = deduplicateArray(wallets.map(({ chainId }) => chainId));
  await mapAsyncSequential(chainIds, (chainId) => {
    const addressesOnChain = wallets.filter((wallet) => wallet.chainId === chainId).map(({ address }) => address);
    return scheduleEventsReindex(transaction, addressesOnChain, [chainId]);
  });
};

// Returns true when the database holds the plan: written after a yes, or nothing to change
const applyWritePlan = async (databaseHost: string, plan: WritePlan): Promise<boolean> => {
  if (!plan.hasChanges) {
    console.log('\nNothing to change.');
    return true;
  }

  if (!(await confirm(`\nApply to ${databaseHost}? [y/N] `))) {
    console.log('Nothing was written.');
    return false;
  }

  try {
    await getTransactionalDb().transaction(plan.write);
  } finally {
    // Only the write uses the pool, and its connections keep the process alive
    await getTransactionalDb().$client.end();
  }

  console.log('Written.');
  return true;
};

const insertSpenderAuditEvent = async (
  transaction: DatabaseTransaction,
  command: CommandOf<'spender set'> | CommandOf<'spender delete'>,
  before: SpenderLabelWithRole | undefined,
  after: SpenderLabelWithRole | undefined,
): Promise<void> => {
  await insertAuditEvent(transaction, {
    action: 'admin_spender_label_changed',
    actorAddress: command.actorAddress,
    targetAddress: command.address,
    chainId: command.chainId,
    details: { before: toSpenderAuditValues(before), after: toSpenderAuditValues(after), reason: command.reason },
  });
};

const insertTokenAuditEvent = async (
  transaction: DatabaseTransaction,
  command: CommandOf<'token set'> | CommandOf<'token delete'>,
  before: TokenLabelAuditValues | undefined,
  after: TokenLabelAuditValues | undefined,
): Promise<void> => {
  await insertAuditEvent(transaction, {
    action: 'admin_token_label_changed',
    actorAddress: command.actorAddress,
    targetAddress: command.address,
    chainId: command.chainId,
    details: { before: before ?? null, after: after ?? null, reason: command.reason },
  });
};

const printSpenderPlan = async (
  chainId: number,
  address: Address,
  before: SpenderLabelWithRole | undefined,
  after: SpenderLabelWithRole | undefined,
): Promise<void> => {
  const mergedMetadata = (await getCachedSpenderMetadata(chainId, [address])).get(address);
  const mergedRiskFactors = mergedMetadata?.riskFactors ?? [];

  console.log(`\nSpender ${address} on ${formatChain(chainId)}`);
  if (chainId === ALL_CHAINS_CHAIN_ID) console.log('Chain id 0 view: the every-chain label and ScamSniffer only');
  console.log(`Merged name now: ${formatValue(mergedMetadata?.name)}`);
  console.log(
    `Merged risk now: ${mergedRiskFactors.length === 0 ? 'none' : mergedRiskFactors.map(formatRiskFactor).join(', ')}`,
  );

  printRowDiff(`labels.spenders row (chain id ${chainId})`, before, after, SPENDER_COLUMNS);

  if (hasExploitRiskFactor(before) && !hasExploitRiskFactor(after)) {
    console.log("Warning: this removes the imported 'exploit' risk factor, and the CLI cannot add it back.");
  }

  if (!haveSameRiskFactors(before?.riskFactors ?? [], after?.riskFactors ?? [])) {
    await printImpact(chainId, address, 'spender');
  }
};

const printTokenPlan = async (
  chainId: number,
  address: Address,
  beforeLabel: TokenLabel | undefined,
  after: TokenLabelAuditValues | undefined,
): Promise<void> => {
  const mergedMetadata = (await getCachedTokenMetadata(chainId as DocumentedChainId, [address])).get(address);

  console.log(`\nToken ${address} on ${formatChain(chainId)}`);
  console.log(
    `Merged now: symbol ${formatValue(mergedMetadata?.symbol)}, ` +
      `decimals ${formatValue(mergedMetadata?.decimals)}, ` +
      `logo ${formatValue(mergedMetadata?.logoUrl)}, ` +
      `spam reason ${formatValue(mergedMetadata?.spamReason)}`,
  );

  if (beforeLabel) {
    console.log(
      `Row timestamps: edited_at ${formatValue(beforeLabel.editedAt)}, imported_at ${formatValue(beforeLabel.importedAt)}`,
    );
  }

  printRowDiff(`labels.tokens row (chain id ${chainId})`, beforeLabel, after, TOKEN_COLUMNS);

  // Any row turns the spam heuristics off unless is_spam = true, so a new or deleted row can change the verdict too
  if (!beforeLabel || !after || beforeLabel.isSpam !== after.isSpam) {
    await printImpact(chainId, address, 'token');
  }
};

const printImpact = async (chainId: number, address: Address, column: 'spender' | 'token'): Promise<void> => {
  const { wallets, ultimateWallets } = await countAffectedWallets({ chainId, addresses: [address], column });
  const relation = column === 'spender' ? 'an allowance to this spender' : 'an allowance of this token';

  console.log(
    `Impact: ${formatCount(wallets)} wallets with ${relation} on ${formatChain(chainId)}, ` +
      `${formatCount(ultimateWallets)} of them Ultimate`,
  );
};

const printRowDiff = <TValues extends object>(
  title: string,
  before: TValues | undefined,
  after: TValues | undefined,
  columns: ReadonlyArray<readonly [keyof TValues, string]>,
): void => {
  console.log(!before ? `${title}: new row` : !after ? `${title}: deleted` : `${title}:`);

  columns.forEach(([key, columnName]) => {
    const beforeText = before && formatValue(before[key]);
    const afterText = after && formatValue(after[key]);
    const isChanged = before && after && beforeText !== afterText;
    console.log(
      `  ${columnName.padEnd(13)} ${isChanged ? `${beforeText} -> ${afterText}` : (beforeText ?? afterText)}`,
    );
  });
};

const printExploitListClone = (clone: ExploitListClone): void => {
  const addressCount = clone.exploits.reduce((total, exploit) => total + exploit.addresses.length, 0);

  console.log(`approval-exploit-list clone ${EXPLOIT_LIST_CLONE_PATH} on ${clone.branch} at ${clone.commit}`);
  console.log(`exploits: ${clone.exploits.length} files, ${formatCount(addressCount)} addresses`);
};

const printExploitPlan = (plan: ExploitChangePlan): void => {
  console.log(`\nexploits: ${plan.changes.length} changes planned, ${plan.unchangedCount} unchanged`);
  plan.changes.forEach(printExploitChange);
};

const printExploitChange = (change: ExploitChange): void => {
  const exploit = (change.after ?? change.before)!;
  console.log(`\n  ${getExploitChangeKind(change)} ${change.slug}: ${formatValue(exploit.name)}, ${exploit.date}`);

  const changedFields = change.before && change.after ? formatChangedExploitFields(change.before, change.after) : [];
  if (changedFields.length > 0) console.log(`    changed fields: ${changedFields.join('; ')}`);

  printExploitAddresses('added', change.addedAddresses);
  printExploitAddresses('removed', change.removedAddresses);
};

// 'fixed' keeps the addresses for the pages, and they no longer add a risk factor
const getExploitChangeKind = (change: ExploitChange): string => {
  if (change.kind === 'changed' && !change.before?.fixed && change.after?.fixed) return 'fixed';
  return change.kind;
};

const formatChangedExploitFields = (before: Exploit, after: Exploit): string[] => {
  return getChangedExploitFields(before, after).map((field) => {
    // The prose and the article list are too long for one line
    if (field === 'description' || field === 'longDescription' || field === 'metaArticleUrls') return field;
    return `${field} ${formatValue(before[field])} -> ${formatValue(after[field])}`;
  });
};

const printExploitAddresses = (direction: 'added' | 'removed', addresses: AddressOnChain[]): void => {
  if (addresses.length === 0) return;

  console.log(`    ${direction} addresses (${formatCount(addresses.length)}):`);
  addresses.slice(0, MAX_PRINTED_ADDRESSES).forEach(({ chainId, address }) => {
    console.log(`      ${direction === 'added' ? '+' : '-'} ${chainId}:${address}`);
  });

  if (addresses.length > MAX_PRINTED_ADDRESSES) {
    console.log(`      and ${formatCount(addresses.length - MAX_PRINTED_ADDRESSES)} more`);
  }
};

const printUnknownChainWarning = (plan: ExploitChangePlan): void => {
  const plannedChainIds = plan.changes.flatMap((change) =>
    (change.after?.addresses ?? []).map(({ chainId }) => chainId),
  );
  const unknownChainIds = deduplicateArray(plannedChainIds).filter(
    (chainId) => getChainConfig(chainId as DocumentedChainId) === undefined,
  );

  if (unknownChainIds.length > 0) {
    console.log(`\nWarning: no chain entry in packages/core/lib/chains for chain ids ${unknownChainIds.join(', ')}`);
  }
};

const printSection = (title: string, value: unknown): void => {
  const isEmpty = value === undefined || (Array.isArray(value) && value.length === 0);
  console.log(`\n${title}:`);
  console.log(isEmpty ? '  none' : inspect(value, { depth: null, breakLength: 120 }));
};

// The exact row of this chain id, not the chain id 0 row that also applies to it. Its risk factors are in the stored
// form, so the diff, the audit row and the comparisons see the same key order as the new values.
const getSpenderLabel = async (chainId: number, address: Address): Promise<SpenderLabelWithRole | undefined> => {
  const [label] = await getDb()
    .select()
    .from(labelsSpenders)
    .where(and(eq(labelsSpenders.chainId, chainId), eq(labelsSpenders.address, address)));
  return label && { ...label, riskFactors: toStoredRiskFactors(label.riskFactors) };
};

const toTokenValues = (label: TokenLabel): TokenLabelAuditValues => ({
  symbol: label.symbol,
  decimals: label.decimals,
  logoUrl: label.logoUrl,
  isSpam: label.isSpam,
  note: label.note,
});

const toSpenderAuditValues = (label: SpenderLabelWithRole | undefined): SpenderLabelAuditValues | null => {
  return label ? { name: label.name, contractRole: label.contractRole, riskFactors: label.riskFactors } : null;
};

// The addresses stay in the clone's git history
const toExploitAuditValues = (exploit: Exploit | undefined): ExploitAuditValues | null => {
  return exploit ? { fixed: exploit.fixed, addressCount: exploit.addresses.length } : null;
};

const haveSameSpenderValues = (before: SpenderLabelWithRole, after: SpenderLabelWithRole): boolean => {
  return (
    before.name === after.name &&
    before.contractRole === after.contractRole &&
    haveSameRiskFactors(before.riskFactors, after.riskFactors)
  );
};

const haveSameRiskFactors = (before: SpenderLabelRiskFactor[], after: SpenderLabelRiskFactor[]): boolean => {
  return JSON.stringify(before) === JSON.stringify(after);
};

const hasExploitRiskFactor = (label: SpenderLabel | undefined): boolean => {
  return label?.riskFactors.some((riskFactor) => riskFactor.type === 'exploit') ?? false;
};

const haveSameTokenValues = (before: TokenLabelAuditValues, after: TokenLabelAuditValues): boolean => {
  return TOKEN_COLUMNS.every(([key]) => before[key] === after[key]);
};

const confirm = async (question: string): Promise<boolean> => {
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await readline.question(question);
  readline.close();
  return ['y', 'yes'].includes(answer.trim().toLowerCase());
};

const parseCommand = (): Command => {
  const { values, positionals } = readArguments();
  if (values.help) return exitWithUsage();

  const isGet = positionals[0] === 'get';
  const kind = isGet ? 'get' : positionals.slice(0, 2).join(' ');
  const operands = positionals.slice(isGet ? 1 : 2);
  if (!isCommandKind(kind)) return exitWithUsage(`Unknown command: ${positionals.join(' ') || '(none)'}`);

  const allowedOptions: readonly string[] = COMMAND_OPTIONS[kind];
  const unexpectedOptions = Object.keys(values).filter((option) => !allowedOptions.includes(option));
  if (unexpectedOptions.length > 0) {
    return exitWithUsage(`${kind} does not take ${unexpectedOptions.map((option) => `--${option}`).join(', ')}`);
  }

  switch (kind) {
    case 'get':
      return { kind, ...parseAddressOperands(kind, operands, false) };
    case 'spender set': {
      const spenderName = values.name === undefined ? undefined : parseClearableText(values.name, 'name');
      const contractRoleText = values['contract-role'];
      const contractRole =
        contractRoleText === undefined ? undefined : parseClearableText(contractRoleText, 'contract-role');
      const riskFactors = values.risk === undefined ? undefined : parseRiskFactors(values.risk);
      if (spenderName === undefined && contractRole === undefined && riskFactors === undefined) {
        return exitWithUsage('Pass at least one of --name, --contract-role and --risk');
      }
      return {
        kind,
        spenderName,
        contractRole,
        riskFactors,
        ...parseAddressOperands(kind, operands, true),
        ...parseWriteOptions(values),
      };
    }
    case 'spender delete':
      return { kind, ...parseAddressOperands(kind, operands, true), ...parseWriteOptions(values) };
    case 'token set':
      return {
        kind,
        fields: parseTokenFields(values),
        ...parseAddressOperands(kind, operands, false),
        ...parseWriteOptions(values),
      };
    case 'token delete':
      return { kind, ...parseAddressOperands(kind, operands, false), ...parseWriteOptions(values) };
    case 'exploit set':
      if (operands.length > 0) return exitWithUsage('exploit set takes no operands: it applies the whole clone');
      return { kind, ...parseWriteOptions(values) };
  }
};

const readArguments = () => {
  try {
    return parseArgs({ options: OPTIONS, allowPositionals: true });
  } catch (error) {
    return exitWithUsage((error as Error).message);
  }
};

type ArgumentValues = ReturnType<typeof readArguments>['values'];

const parseAddressOperands = (kind: CommandKind, operands: string[], allowAllChains: boolean): AddressOnChain => {
  if (operands.length !== 2) {
    return exitWithUsage(`${kind} takes ${allowAllChains ? '<chainId|all>' : '<chainId>'} and <address>`);
  }

  const [chainIdText, addressText] = operands;
  return { chainId: parseChainId(chainIdText, allowAllChains), address: parseAddress(addressText) };
};

// Checked before any query: the label tables have integer chain id columns
const parseChainId = (value: string, allowAllChains: boolean): number => {
  const chainId = /^\d+$/.test(value) ? Number(value) : Number.NaN;
  if (allowAllChains && (value === 'all' || chainId === ALL_CHAINS_CHAIN_ID)) return ALL_CHAINS_CHAIN_ID;

  if (!isLabelChainId(chainId)) {
    const allChainsText = allowAllChains ? ', or 0 or all for every chain' : '';
    return exitWithUsage(`The chain id must be an integer from 1 to ${MAX_CHAIN_ID}${allChainsText}: ${value}`);
  }

  return chainId;
};

// A mixed-case address must have a valid checksum, which catches a typo in a checksummed address
const parseAddress = (value: string): Address => {
  if (!isAddress(value))
    return exitWithUsage(`Not an address, or a mixed-case address with a wrong checksum: ${value}`);
  return getAddress(value);
};

// Each --risk value is one factor. A single `--risk none` clears the set.
const parseRiskFactors = (values: string[]): SpenderLabelRiskFactor[] => {
  if (values.length === 1 && values[0] === NONE) return [];
  if (values.includes(NONE)) return exitWithUsage('--risk none clears the set, so it cannot be combined with factors');

  return toStoredRiskFactors(values.map(parseRiskFactor));
};

// A type, or a type and its data as type=data. The data is everything after the first '='.
const parseRiskFactor = (value: string): SpenderLabelRiskFactor => {
  const separatorIndex = value.indexOf('=');
  const type = (separatorIndex === -1 ? value : value.slice(0, separatorIndex)).trim();
  const data = separatorIndex === -1 ? undefined : value.slice(separatorIndex + 1).trim();

  if (type === 'exploit') {
    return exitWithUsage("--risk cannot set 'exploit': a named exploit goes through `exploit set`");
  }

  if (!isEditableRiskType(type)) {
    return exitWithUsage(`--risk takes ${EDITABLE_RISK_TYPES.join(', ')} or none, not '${type}'`);
  }

  if (data === '') return exitWithUsage(`--risk ${type}= needs data after the '=', or no '='`);

  return data === undefined ? { type } : { type, data };
};

// Only the passed options become fields, so editTokenLabel writes only those columns
const parseTokenFields = (values: ArgumentValues): TokenLabelFields => {
  const fields: TokenLabelFields = {
    ...(values.symbol === undefined ? {} : { symbol: parseSymbol(values.symbol) }),
    ...(values.decimals === undefined ? {} : { decimals: parseDecimals(values.decimals) }),
    ...(values['logo-url'] === undefined ? {} : { logoUrl: parseLogoUrl(values['logo-url']) }),
    ...(values.spam === undefined ? {} : { isSpam: parseSpamFlag(values.spam) }),
    ...(values.note === undefined ? {} : { note: parseClearableText(values.note, 'note') }),
  };

  if (Object.keys(fields).length === 0) {
    return exitWithUsage('Pass at least one of --symbol, --decimals, --logo-url, --spam and --note');
  }

  return fields;
};

// --symbol and --logo-url take the importer's rules (isTokenSymbol, isTokenLogoUrl), so both writers of labels.tokens
// accept the same values
const parseSymbol = (value: string): string | null => {
  if (value === NONE) return null;
  if (!isTokenSymbol(value)) {
    return exitWithUsage(
      `--symbol must be 1 to ${MAX_SYMBOL_LENGTH} characters after trimming, without control characters; use none to clear it: ${value}`,
    );
  }

  return value.trim();
};

const parseDecimals = (value: string): number | null => {
  if (value === NONE) return null;

  const decimals = /^\d+$/.test(value) ? Number(value) : Number.NaN;
  if (!isTokenDecimals(decimals)) {
    return exitWithUsage(`--decimals must be an integer from 0 to ${MAX_TOKEN_DECIMALS}: ${value}`);
  }

  return decimals;
};

const parseLogoUrl = (value: string): string | null => {
  if (value === NONE) return null;
  if (!isTokenLogoUrl(value)) {
    return exitWithUsage(
      `--logo-url must be an https URL of at most ${MAX_LOGO_URL_LENGTH} characters without control characters: ${value}`,
    );
  }

  return value;
};

const parseSpamFlag = (value: string): boolean | null => {
  if (value === NONE) return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return exitWithUsage(`--spam must be true, false or none: ${value}`);
};

const parseClearableText = (value: string, option: OptionName): string | null => {
  if (value === NONE) return null;
  if (value.trim() === '') return exitWithUsage(`--${option} must not be empty; use none to clear it`);
  return value.trim();
};

const parseWriteOptions = (values: ArgumentValues): WriteOptions => {
  const reason = values.reason?.trim();
  if (!reason) return exitWithUsage('Every write needs --reason: the issue URL, the pull request or the evidence');

  return { reason, actorAddress: getAdminAddress() };
};

// The actor of every audit row: the same variable that gates /admin
const getAdminAddress = (): Address => {
  const adminAddress = process.env.ADMIN_ADDRESS;
  if (!adminAddress || !isAddress(adminAddress, { strict: false })) {
    throw new Error('ADMIN_ADDRESS is not set to an address in .env');
  }

  return getAddress(adminAddress);
};

// The hostname only, because the full URL holds the password
const getDatabaseHost = (): string => {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  return new URL(process.env.DATABASE_URL).hostname;
};

const exitWithUsage = (errorMessage?: string): never => {
  if (errorMessage === undefined) {
    console.log(USAGE);
    process.exit(0);
  }

  console.error(`${errorMessage}\n\n${USAGE}`);
  process.exit(1);
};

const isCommandKind = (value: string): value is CommandKind => Object.hasOwn(COMMAND_OPTIONS, value);

const isEditableRiskType = (value: string): value is SpenderRiskType => {
  return (EDITABLE_RISK_TYPES as string[]).includes(value);
};

const formatChain = (chainId: number): string => {
  if (chainId === ALL_CHAINS_CHAIN_ID) return 'every chain (chain id 0)';
  return `chain ${chainId} (${getChainName(chainId as DocumentedChainId)})`;
};

const formatRiskFactor = (riskFactor: RiskFactor): string => {
  const data = riskFactor.data === undefined ? '' : ` ${formatValue(riskFactor.data)}`;
  return `${riskFactor.type}${data} (${riskFactor.source})`;
};

const formatValue = (value: unknown): string => {
  if (value instanceof Date) return value.toISOString();
  return JSON.stringify(value) ?? 'null';
};

const formatCount = (count: number): string => count.toLocaleString('en-US');

// exitCode instead of process.exit, which can cut off output that is piped (for example into tee). It starts at 1,
// because the y/N prompt never settles when stdin ends without an answer, and the process then exits with this code.
process.exitCode = 1;
main().then(
  (succeeded) => {
    process.exitCode = succeeded ? 0 : 1;
  },
  (error) => {
    console.error(error);
    process.exitCode = 1;
  },
);
