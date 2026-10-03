-- Scans query events by address and block range. Without block_number in the index, an address with millions of
-- events (vitalik.eth has 2.96M spam transfers on Polygon) made every scan read its whole partition (1.85 GB).
-- The new index can be built first without blocking writes (CREATE INDEX CONCURRENTLY per partition, then ATTACH);
-- IF NOT EXISTS makes this statement a no-op in that case.
CREATE INDEX IF NOT EXISTS "idx_events_topic1_block_number" ON "indexer"."events" USING btree ("chain_id","topic1","block_number") WHERE "indexer"."events"."topic1" IS NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "indexer"."idx_events_topic1";
