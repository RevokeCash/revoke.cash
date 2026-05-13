CREATE TYPE "monitor"."spam_reason" AS ENUM('whois', 'symbol', 'bytecode', 'airdrop');--> statement-breakpoint
CREATE TYPE "monitor"."token_standard" AS ENUM('erc20', 'erc721', 'erc1155', 'unknown');--> statement-breakpoint
CREATE TABLE "monitor"."token_metadata" (
	"chain_id" integer NOT NULL,
	"token_address" text NOT NULL,
	"token_standard" "monitor"."token_standard" DEFAULT 'unknown' NOT NULL,
	"symbol" text,
	"decimals" integer,
	"total_supply" numeric,
	"icon_url" text,
	"spam_reason" "monitor"."spam_reason",
	"enrichment_error" text,
	"enriched_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "token_metadata_pkey" PRIMARY KEY("chain_id","token_address")
);
--> statement-breakpoint
CREATE INDEX "idx_token_metadata_enriched_at" ON "monitor"."token_metadata" USING btree ("chain_id","enriched_at");--> statement-breakpoint
CREATE INDEX "idx_token_metadata_unenriched" ON "monitor"."token_metadata" USING btree ("chain_id","token_address") WHERE "monitor"."token_metadata"."enriched_at" IS NULL;