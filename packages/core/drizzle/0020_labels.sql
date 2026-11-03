CREATE SCHEMA "labels";
--> statement-breakpoint
CREATE TABLE "labels"."exploit_addresses" (
	"slug" text NOT NULL,
	"chain_id" integer NOT NULL,
	"address" text NOT NULL,
	CONSTRAINT "exploit_addresses_pkey" PRIMARY KEY("slug","chain_id","address")
);
--> statement-breakpoint
CREATE TABLE "labels"."exploits" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"long_description" text,
	"date" date NOT NULL,
	"amount" numeric,
	"fixed" boolean DEFAULT false NOT NULL,
	"article_urls" text[] DEFAULT '{}' NOT NULL,
	CONSTRAINT "exploits_slug_format" CHECK ("labels"."exploits"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "labels"."scamsniffer_blocklist" (
	"address_hash" text PRIMARY KEY NOT NULL,
	"false_positive" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scamsniffer_blocklist_hash_format" CHECK ("labels"."scamsniffer_blocklist"."address_hash" ~ '^[0-9a-f]{32}$')
);
--> statement-breakpoint
CREATE TABLE "labels"."spenders" (
	"chain_id" integer NOT NULL,
	"address" text NOT NULL,
	"name" text,
	"risk_factors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "spenders_pkey" PRIMARY KEY("chain_id","address"),
	CONSTRAINT "spenders_chain_id_not_negative" CHECK ("labels"."spenders"."chain_id" >= 0),
	CONSTRAINT "spenders_name_or_risk" CHECK ("labels"."spenders"."name" IS NOT NULL OR "labels"."spenders"."risk_factors" <> '[]'::jsonb),
	CONSTRAINT "spenders_risk_factor_types" CHECK (jsonb_typeof("labels"."spenders"."risk_factors") = 'array' AND jsonb_path_query_array("labels"."spenders"."risk_factors", '$[*].type') <@ '["blocklist","deprecated","exploit","unsafe"]'::jsonb)
);
--> statement-breakpoint
CREATE TABLE "labels"."tokens" (
	"chain_id" integer NOT NULL,
	"address" text NOT NULL,
	"symbol" text,
	"decimals" integer,
	"logo_url" text,
	"is_spam" boolean,
	"note" text,
	"edited_at" timestamp with time zone,
	"imported_at" timestamp with time zone,
	CONSTRAINT "tokens_pkey" PRIMARY KEY("chain_id","address"),
	CONSTRAINT "tokens_chain_id_positive" CHECK ("labels"."tokens"."chain_id" > 0),
	CONSTRAINT "tokens_decimals_range" CHECK ("labels"."tokens"."decimals" IS NULL OR "labels"."tokens"."decimals" BETWEEN 0 AND 77),
	CONSTRAINT "tokens_not_empty" CHECK ("labels"."tokens"."symbol" IS NOT NULL OR "labels"."tokens"."decimals" IS NOT NULL OR "labels"."tokens"."logo_url" IS NOT NULL OR "labels"."tokens"."is_spam" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "labels"."exploit_addresses" ADD CONSTRAINT "exploit_addresses_slug_exploits_slug_fk" FOREIGN KEY ("slug") REFERENCES "labels"."exploits"("slug") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "idx_exploit_addresses_chain_address" ON "labels"."exploit_addresses" USING btree ("chain_id","address");--> statement-breakpoint

-- ScamSniffer false positives. The daily sync never touches rows with false_positive = true, and a third
-- false positive is one more row in the next pending migration.
INSERT INTO "labels"."scamsniffer_blocklist" ("address_hash", "false_positive") VALUES
  ('8bcaa4f9c51060ef4566b968061fc942', true), -- Permit2
  ('50828234ebb84d3994f90d4686924fd8', true); -- CoW VaultRelayer
--> statement-breakpoint

-- indexer.spender_checks: revoke.cash's own spender checks, copied from spender_metadata as this migration runs
CREATE TABLE "indexer"."spender_checks" (
	"chain_id" integer NOT NULL,
	"spender_address" text NOT NULL,
	"name" text,
	"risk_factors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"enrichment_error" text,
	"enriched_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "spender_checks_pkey" PRIMARY KEY("chain_id","spender_address")
);
--> statement-breakpoint

-- Copy only computed facts: the on-chain names and the on-chain and Webacy factors, without the removed phishing_risk
-- type. Names, curated risk, exploits and ScamSniffer come from labels.*. Applied on push day, shortly before the
-- Deploy A push, so the copied checks are hours old at most (the new code re-checks rows after 1 day).
INSERT INTO "indexer"."spender_checks" ("chain_id", "spender_address", "name", "risk_factors", "enrichment_error", "enriched_at")
SELECT "chain_id", "spender_address",
       CASE WHEN "name" IN ('OpenSea (old)', 'Scam Delegate') THEN "name" END,
       jsonb_path_query_array("risk_factors", '$[*] ? ((@.source == "onchain" || @.source == "webacy") && @.type != "phishing_risk")'),
       "enrichment_error", "enriched_at"
FROM "indexer"."spender_metadata"
WHERE "enriched_at" IS NOT NULL;

-- Removed chains: Ethereum Classic (61), Filecoin (314), KCC (321), Reya (1729) and LightLink (1890) on 2026-10-09,
-- DATA (1514) and Blast (81457) on 2026-10-24, and Matchain (698) on 2026-11-05

-- Dropping a partition also removes all events stored in it. IF EXISTS in case a partition
-- was already dropped manually.
DROP TABLE IF EXISTS "indexer_partitions"."events_61";--> statement-breakpoint
DROP TABLE IF EXISTS "indexer_partitions"."events_314";--> statement-breakpoint
DROP TABLE IF EXISTS "indexer_partitions"."events_321";--> statement-breakpoint
DROP TABLE IF EXISTS "indexer_partitions"."events_698";--> statement-breakpoint
DROP TABLE IF EXISTS "indexer_partitions"."events_1514";--> statement-breakpoint
DROP TABLE IF EXISTS "indexer_partitions"."events_1729";--> statement-breakpoint
DROP TABLE IF EXISTS "indexer_partitions"."events_1890";--> statement-breakpoint
DROP TABLE IF EXISTS "indexer_partitions"."events_81457";--> statement-breakpoint

-- Remove all remaining indexer state for these chains.
DELETE FROM "indexer"."events_state" WHERE "chain_id" IN (61, 314, 321, 698, 1514, 1729, 1890, 81457);--> statement-breakpoint
DELETE FROM "indexer"."block_timestamps" WHERE "chain_id" IN (61, 314, 321, 698, 1514, 1729, 1890, 81457);--> statement-breakpoint
DELETE FROM "indexer"."allowances" WHERE "chain_id" IN (61, 314, 321, 698, 1514, 1729, 1890, 81457);--> statement-breakpoint
DELETE FROM "indexer"."allowance_state" WHERE "chain_id" IN (61, 314, 321, 698, 1514, 1729, 1890, 81457);--> statement-breakpoint
DELETE FROM "indexer"."token_metadata" WHERE "chain_id" IN (61, 314, 321, 698, 1514, 1729, 1890, 81457);--> statement-breakpoint
DELETE FROM "indexer"."spender_metadata" WHERE "chain_id" IN (61, 314, 321, 698, 1514, 1729, 1890, 81457);--> statement-breakpoint
DELETE FROM "indexer"."spender_checks" WHERE "chain_id" IN (61, 314, 321, 698, 1514, 1729, 1890, 81457);--> statement-breakpoint
DELETE FROM "indexer"."transfer_details" WHERE "chain_id" IN (61, 314, 321, 698, 1514, 1729, 1890, 81457);--> statement-breakpoint
