ALTER TABLE "batch_revokes" ADD COLUMN "fee_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "batch_revokes" ADD COLUMN "fee_verification_error" text;--> statement-breakpoint

-- Rows recorded before on-chain fee verification existed were counted as revenue as reported, so they
-- keep counting: every paid row is marked verified at its recording time. Rows recorded from now on
-- are verified by the fee verification cron.
UPDATE "batch_revokes" SET "fee_verified_at" = "timestamp" WHERE "fee_usd_cents" > 0;--> statement-breakpoint

-- A fee transaction was recorded twice for a handful of batches (repeated client reports seconds
-- apart); the later duplicate goes so the unique index below can be created.
DELETE FROM "batch_revokes" AS "duplicate"
USING "batch_revokes" AS "original"
WHERE "duplicate"."chain_id" = "original"."chain_id"
  AND "duplicate"."fee_transaction_hash" = "original"."fee_transaction_hash"
  AND "duplicate"."id" > "original"."id";--> statement-breakpoint

CREATE UNIQUE INDEX "idx_batch_revokes_chain_fee_transaction_hash_unique" ON "batch_revokes" USING btree ("chain_id","fee_transaction_hash") WHERE "batch_revokes"."fee_transaction_hash" IS NOT NULL;--> statement-breakpoint

-- Hard-remove indexer data for chains whose support has been removed from the app since migration 0016.
-- Mainnets: Lisk (1135), Gravity Alpha (1625), Zircuit (48900), Harmony (1666600000)

-- Dropping a partition also removes all events stored in it. IF EXISTS in case a partition
-- was already dropped manually.
DROP TABLE IF EXISTS "indexer_partitions"."events_1135";--> statement-breakpoint
DROP TABLE IF EXISTS "indexer_partitions"."events_1625";--> statement-breakpoint
DROP TABLE IF EXISTS "indexer_partitions"."events_48900";--> statement-breakpoint
DROP TABLE IF EXISTS "indexer_partitions"."events_1666600000";--> statement-breakpoint

-- Remove all remaining indexer state for these chains.
DELETE FROM "indexer"."events_state" WHERE "chain_id" IN (1135, 1625, 48900, 1666600000);--> statement-breakpoint
DELETE FROM "indexer"."block_timestamps" WHERE "chain_id" IN (1135, 1625, 48900, 1666600000);--> statement-breakpoint
DELETE FROM "indexer"."allowances" WHERE "chain_id" IN (1135, 1625, 48900, 1666600000);--> statement-breakpoint
DELETE FROM "indexer"."allowance_state" WHERE "chain_id" IN (1135, 1625, 48900, 1666600000);--> statement-breakpoint
DELETE FROM "indexer"."token_metadata" WHERE "chain_id" IN (1135, 1625, 48900, 1666600000);--> statement-breakpoint
DELETE FROM "indexer"."spender_metadata" WHERE "chain_id" IN (1135, 1625, 48900, 1666600000);--> statement-breakpoint
DELETE FROM "indexer"."transfer_details" WHERE "chain_id" IN (1135, 1625, 48900, 1666600000);--> statement-breakpoint

-- Partition for Arc, added to ORDERED_CHAINS on 2026-09-16
CREATE TABLE "indexer_partitions"."events_5042" PARTITION OF "indexer"."events" FOR VALUES IN (5042); -- Arc
