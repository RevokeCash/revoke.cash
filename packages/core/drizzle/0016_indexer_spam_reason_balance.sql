ALTER TYPE "indexer"."spam_reason" ADD VALUE 'balance';--> statement-breakpoint

-- Hard-remove indexer data for chains whose support has been removed from the app since migration 0014.
-- Mainnets: Cronos (25), Neon (245022934), Degen Chain (666666666)

-- Dropping a partition also removes all events stored in it. IF EXISTS in case a partition
-- was already dropped manually.
DROP TABLE IF EXISTS "indexer_partitions"."events_25";--> statement-breakpoint
DROP TABLE IF EXISTS "indexer_partitions"."events_245022934";--> statement-breakpoint
DROP TABLE IF EXISTS "indexer_partitions"."events_666666666";--> statement-breakpoint

-- Remove all remaining indexer state for these chains.
DELETE FROM "indexer"."events_state" WHERE "chain_id" IN (25, 245022934, 666666666);--> statement-breakpoint
DELETE FROM "indexer"."block_timestamps" WHERE "chain_id" IN (25, 245022934, 666666666);--> statement-breakpoint
DELETE FROM "indexer"."allowances" WHERE "chain_id" IN (25, 245022934, 666666666);--> statement-breakpoint
DELETE FROM "indexer"."allowance_state" WHERE "chain_id" IN (25, 245022934, 666666666);--> statement-breakpoint
DELETE FROM "indexer"."token_metadata" WHERE "chain_id" IN (25, 245022934, 666666666);--> statement-breakpoint
DELETE FROM "indexer"."spender_metadata" WHERE "chain_id" IN (25, 245022934, 666666666);--> statement-breakpoint
DELETE FROM "indexer"."transfer_details" WHERE "chain_id" IN (25, 245022934, 666666666);
