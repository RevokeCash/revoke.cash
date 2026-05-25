CREATE TYPE "indexer"."spam_reason" AS ENUM('whois', 'symbol', 'bytecode', 'airdrop');--> statement-breakpoint
CREATE TYPE "indexer"."token_standard" AS ENUM('erc20', 'erc721', 'erc1155', 'unknown');--> statement-breakpoint
CREATE TABLE "indexer"."token_metadata" (
	"chain_id" integer NOT NULL,
	"token_address" text NOT NULL,
	"token_standard" "indexer"."token_standard" DEFAULT 'unknown' NOT NULL,
	"symbol" text,
	"decimals" integer,
	"total_supply" numeric,
	"icon_url" text,
	"spam_reason" "indexer"."spam_reason",
	"enrichment_error" text,
	"enriched_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "token_metadata_pkey" PRIMARY KEY("chain_id","token_address")
);
--> statement-breakpoint
CREATE INDEX "idx_token_metadata_enriched_at" ON "indexer"."token_metadata" USING btree ("chain_id","enriched_at");--> statement-breakpoint
CREATE INDEX "idx_token_metadata_unenriched" ON "indexer"."token_metadata" USING btree ("chain_id","token_address") WHERE "indexer"."token_metadata"."enriched_at" IS NULL;