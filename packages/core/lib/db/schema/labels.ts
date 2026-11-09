import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgSchema,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { MAX_TOKEN_DECIMALS } from '../../labels/merge';
import { lowercaseAddress } from '../types/lowercase-address';

// Labels and risk facts that people or feeds supply, and the request log of the label routes. What revoke.cash computes
// itself lives in the indexer schema.
export const labelsSchema = pgSchema('labels');

export const labelsAddressTypeEnum = labelsSchema.enum('address_type', ['spender', 'token']);

// The risk types of labels.spenders.risk_factors. Named exploits are not stored here; labels.exploit_addresses owns
// them. 'exploit' exists only for the imported whois factors that have no exploit name.
export const SPENDER_RISK_TYPES = ['blocklist', 'deprecated', 'exploit', 'unsafe'] as const;
type SpenderRiskType = (typeof SPENDER_RISK_TYPES)[number];

export const labelsSpenders = labelsSchema.table(
  'spenders',
  {
    // 0 = every chain id (ALL_CHAINS_CHAIN_ID)
    chainId: integer('chain_id').notNull(),
    address: lowercaseAddress('address').notNull(),
    name: text('name'),
    // What this contract does in the project of `name`, e.g. 'Swap Router' or 'EIP7702 Delegator'. For our own
    // understanding: only the labels CLI and the admin audit log show it.
    contractRole: text('contract_role'),
    // Served as {type, source: 'whois', data}
    riskFactors: jsonb('risk_factors').notNull().$type<Array<{ type: SpenderRiskType; data?: string }>>().default([]),
  },
  (table) => [
    primaryKey({ name: 'spenders_pkey', columns: [table.chainId, table.address] }),
    check('spenders_chain_id_not_negative', sql`${table.chainId} >= 0`),
    check('spenders_name_or_risk', sql`${table.name} IS NOT NULL OR ${table.riskFactors} <> '[]'::jsonb`),
    check(
      'spenders_risk_factor_types',
      sql`jsonb_typeof(${table.riskFactors}) = 'array' AND jsonb_path_query_array(${table.riskFactors}, '$[*].type') <@ ${sql.raw(`'${JSON.stringify(SPENDER_RISK_TYPES)}'::jsonb`)}`,
    ),
  ],
);

export const labelsTokens = labelsSchema.table(
  'tokens',
  {
    chainId: integer('chain_id').notNull(),
    address: lowercaseAddress('address').notNull(),
    // Collection name for NFTs
    symbol: text('symbol'),
    // NULL = readers use the on-chain decimals
    decimals: integer('decimals'),
    logoUrl: text('logo_url'),
    // true = spam, false = known good, NULL = not stated
    isSpam: boolean('is_spam'),
    note: text('note'),
    editedAt: timestamp('edited_at', { withTimezone: true }),
    importedAt: timestamp('imported_at', { withTimezone: true }),
  },
  (table) => [
    primaryKey({ name: 'tokens_pkey', columns: [table.chainId, table.address] }),
    check('tokens_chain_id_positive', sql`${table.chainId} > 0`),
    check(
      'tokens_decimals_range',
      sql`${table.decimals} IS NULL OR ${table.decimals} BETWEEN 0 AND ${sql.raw(String(MAX_TOKEN_DECIMALS))}`,
    ),
    check(
      'tokens_not_empty',
      sql`${table.symbol} IS NOT NULL OR ${table.decimals} IS NOT NULL OR ${table.logoUrl} IS NOT NULL OR ${table.isSpam} IS NOT NULL`,
    ),
  ],
);

export const labelsExploits = labelsSchema.table(
  'exploits',
  {
    slug: text('slug').primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    longDescription: text('long_description'),
    date: date('date', { mode: 'string' }).notNull(),
    // USD millions; NULL while the amount is unknown
    amount: numeric('amount', { mode: 'number' }),
    fixed: boolean('fixed').notNull().default(false),
    articleUrls: text('article_urls').array().notNull().default(sql`'{}'`),
  },
  (table) => [check('exploits_slug_format', sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`)],
);

export const labelsExploitAddresses = labelsSchema.table(
  'exploit_addresses',
  {
    slug: text('slug')
      .notNull()
      .references(() => labelsExploits.slug, { onDelete: 'cascade', onUpdate: 'cascade' }),
    chainId: integer('chain_id').notNull(),
    address: lowercaseAddress('address').notNull(),
  },
  (table) => [
    primaryKey({ name: 'exploit_addresses_pkey', columns: [table.slug, table.chainId, table.address] }),
    index('idx_exploit_addresses_chain_address').on(table.chainId, table.address),
  ],
);

export const labelsExploitsRelations = relations(labelsExploits, ({ many }) => ({
  addresses: many(labelsExploitAddresses),
}));

export const labelsExploitAddressesRelations = relations(labelsExploitAddresses, ({ one }) => ({
  exploit: one(labelsExploits, { fields: [labelsExploitAddresses.slug], references: [labelsExploits.slug] }),
}));

export const labelsScamSnifferBlocklist = labelsSchema.table(
  'scamsniffer_blocklist',
  {
    // md5('revokecash:' || lowercase address), as the ScamSniffer API delivers it
    addressHash: text('address_hash').primaryKey(),
    falsePositive: boolean('false_positive').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('scamsniffer_blocklist_hash_format', sql`${table.addressHash} ~ '^[0-9a-f]{32}$'`)],
);

// One row per lookup of a label route, to count over any period the most requested addresses without a label and the
// labels that nobody requests. The routes sit behind a 15-minute CDN cache, so only CDN misses get a row.
export const labelsRequests = labelsSchema.table(
  'requests',
  {
    addressType: labelsAddressTypeEnum('address_type').notNull(),
    chainId: integer('chain_id').notNull(),
    address: lowercaseAddress('address').notNull(),
    requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  },
  // BRIN: rows arrive in requested_at order, so a tiny index serves every period filter
  (table) => [index('idx_requests_requested_at').using('brin', table.requestedAt)],
);
