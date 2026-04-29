CREATE TABLE "monitor"."block_timestamps" (
	"chain_id" integer NOT NULL,
	"block_number" bigint NOT NULL,
	"timestamp" bigint NOT NULL,
	CONSTRAINT "block_timestamps_pkey" PRIMARY KEY("chain_id","block_number")
);
