-- Partition for Elysium, added to ORDERED_CHAINS on 2026-11-10
CREATE TABLE "indexer_partitions"."events_99901" PARTITION OF "indexer"."events" FOR VALUES IN (99901); -- Elysium
