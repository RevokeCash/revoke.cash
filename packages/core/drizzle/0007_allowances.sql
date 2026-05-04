CREATE TYPE "monitor"."approval_type" AS ENUM('erc721_single', 'erc721_all', 'erc20', 'permit2');--> statement-breakpoint
CREATE TABLE "monitor"."allowance_state" (
	"address" text NOT NULL,
	"chain_id" integer NOT NULL,
	"computed_at" timestamp with time zone,
	"computed_to_block" bigint,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "allowance_state_pkey" PRIMARY KEY("address","chain_id")
);
--> statement-breakpoint
CREATE TABLE "monitor"."allowances" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" integer NOT NULL,
	"address" text NOT NULL,
	"token_address" text NOT NULL,
	"spender_address" text NOT NULL,
	"approval_type" "monitor"."approval_type" NOT NULL,
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
CREATE INDEX "idx_allowances_address" ON "monitor"."allowances" USING btree ("address","chain_id");--> statement-breakpoint
CREATE INDEX "idx_allowances_spender" ON "monitor"."allowances" USING btree ("spender_address","chain_id");--> statement-breakpoint
CREATE INDEX "idx_allowances_token" ON "monitor"."allowances" USING btree ("token_address","chain_id");--> statement-breakpoint
ALTER TABLE "monitor"."events_cache" ADD COLUMN "reorged" boolean DEFAULT false NOT NULL;
