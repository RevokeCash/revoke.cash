CREATE TYPE "indexer"."allowance_type" AS ENUM('erc721_single', 'erc721_all', 'erc20', 'permit2');--> statement-breakpoint
CREATE TABLE "indexer"."allowance_state" (
	"address" text NOT NULL,
	"chain_id" integer NOT NULL,
	"computed_at" timestamp with time zone,
	"computed_to_block" bigint,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_evaluated_at" timestamp with time zone,
	CONSTRAINT "allowance_state_pkey" PRIMARY KEY("address","chain_id")
);
--> statement-breakpoint
CREATE TABLE "indexer"."allowances" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" integer NOT NULL,
	"address" text NOT NULL,
	"token_address" text NOT NULL,
	"spender_address" text NOT NULL,
	"allowance_type" "indexer"."allowance_type" NOT NULL,
	"amount" numeric,
	"token_id" numeric,
	"approved" boolean,
	"permit2_address" text,
	"expiration" bigint,
	"last_updated_block" bigint NOT NULL,
	"last_updated_tx_hash" text NOT NULL,
	"last_updated_timestamp" bigint NOT NULL,
	CONSTRAINT "allowances_pkey" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE INDEX "idx_allowances_address" ON "indexer"."allowances" USING btree ("address","chain_id");--> statement-breakpoint
CREATE INDEX "idx_allowances_spender" ON "indexer"."allowances" USING btree ("spender_address","chain_id");--> statement-breakpoint
CREATE INDEX "idx_allowances_token" ON "indexer"."allowances" USING btree ("token_address","chain_id");