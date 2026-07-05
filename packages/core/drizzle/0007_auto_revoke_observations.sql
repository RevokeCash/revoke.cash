CREATE TYPE "auto_revoke"."allowance_type" AS ENUM('erc721_single', 'erc721_all', 'erc20', 'permit2');--> statement-breakpoint
DROP TABLE "auto_revoke"."activity_log";--> statement-breakpoint
DROP TYPE "auto_revoke"."activity_status";--> statement-breakpoint
CREATE TABLE "auto_revoke"."observations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"chain_id" integer NOT NULL,
	"trigger_type" "auto_revoke"."trigger_type" NOT NULL,
	"trigger_details" jsonb NOT NULL,
	"rule_snapshot" jsonb NOT NULL,
	"allowance_fingerprint" text NOT NULL,
	"allowance_type" "auto_revoke"."allowance_type" NOT NULL,
	"token_address" text NOT NULL,
	"spender_address" text NOT NULL,
	"token_id" numeric,
	"permit2_address" text,
	"expiration" bigint,
	"last_updated_tx_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "observations_allowance_fingerprint_unique" ON "auto_revoke"."observations" USING btree ("allowance_fingerprint");--> statement-breakpoint
CREATE INDEX "idx_observations_address_created" ON "auto_revoke"."observations" USING btree ("address","created_at");
