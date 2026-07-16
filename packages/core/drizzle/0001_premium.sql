CREATE SCHEMA "premium";
--> statement-breakpoint
CREATE TYPE "premium"."payment_status" AS ENUM('pending', 'confirmed', 'expired', 'failed', 'reversed', 'refunded');--> statement-breakpoint
CREATE TYPE "premium"."plan_tier" AS ENUM('premium', 'ultimate');--> statement-breakpoint
CREATE TABLE "premium"."payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" text NOT NULL,
	"plan_version" integer NOT NULL,
	"owner_address" text NOT NULL,
	"subscription_id" uuid,
	"chain_id" integer NOT NULL,
	"token_address" text NOT NULL,
	"token_symbol" text NOT NULL,
	"token_decimals" integer NOT NULL,
	"amount_usd_cents" integer NOT NULL,
	"status" "premium"."payment_status" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"scan_from_block" bigint NOT NULL,
	"matched_tx_hash" text,
	"vat_region" char(2),
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "premium"."plans" (
	"id" text NOT NULL,
	"version" integer NOT NULL,
	"name" text NOT NULL,
	"price_usd_cents" integer NOT NULL,
	"duration_days" integer NOT NULL,
	"max_addresses" integer NOT NULL,
	"tier" "premium"."plan_tier" DEFAULT 'premium' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_pkey" PRIMARY KEY("id","version")
);
--> statement-breakpoint
CREATE TABLE "premium"."refund_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"refund_amount_usd_cents" integer NOT NULL,
	"reason" text,
	"refund_tx_hash" text,
	"processed_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "premium"."transfer_scan_cursors" (
	"chain_id" integer PRIMARY KEY NOT NULL,
	"last_scanned_block" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "premium"."subscription_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"address" text NOT NULL,
	"added_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "premium"."subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" text NOT NULL,
	"plan_version" integer NOT NULL,
	"owner_address" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "premium"."payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "premium"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premium"."payments" ADD CONSTRAINT "payments_plan_fk" FOREIGN KEY ("plan_id","plan_version") REFERENCES "premium"."plans"("id","version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premium"."refund_requests" ADD CONSTRAINT "refund_requests_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "premium"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premium"."subscription_addresses" ADD CONSTRAINT "subscription_addresses_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "premium"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premium"."subscriptions" ADD CONSTRAINT "subscriptions_plan_fk" FOREIGN KEY ("plan_id","plan_version") REFERENCES "premium"."plans"("id","version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_payments_owner" ON "premium"."payments" USING btree ("owner_address");--> statement-breakpoint
CREATE INDEX "idx_payments_status" ON "premium"."payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payments_chain_scan_start" ON "premium"."payments" USING btree ("chain_id","scan_from_block");--> statement-breakpoint
CREATE INDEX "idx_payments_subscription" ON "premium"."payments" USING btree ("subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_payments_matched_tx_hash_unique" ON "premium"."payments" USING btree ("matched_tx_hash") WHERE "premium"."payments"."matched_tx_hash" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_payments_confirmed_at" ON "premium"."payments" USING btree ("confirmed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_refund_requests_payment_unique" ON "premium"."refund_requests" USING btree ("payment_id") WHERE "premium"."refund_requests"."dismissed_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_refund_requests_refund_tx_hash_unique" ON "premium"."refund_requests" USING btree ("refund_tx_hash") WHERE "premium"."refund_requests"."refund_tx_hash" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_plans_active" ON "premium"."plans" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_plans_active_by_id_unique" ON "premium"."plans" USING btree ("id") WHERE "premium"."plans"."is_active" IS TRUE;--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_addresses_subscription_address_unique" ON "premium"."subscription_addresses" USING btree ("subscription_id","address");--> statement-breakpoint
CREATE INDEX "idx_subscription_addresses_address" ON "premium"."subscription_addresses" USING btree ("address");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_owner" ON "premium"."subscriptions" USING btree ("owner_address");--> statement-breakpoint
CREATE INDEX "idx_subscriptions_ends" ON "premium"."subscriptions" USING btree ("ends_at");

INSERT INTO "premium"."plans" ("id", "version", "name", "price_usd_cents", "duration_days", "max_addresses", "tier", "is_active")
VALUES
  ('premium_annual', 1, 'Premium', 9900, 365, 10, 'premium', true),
  ('ultimate_annual', 1, 'Ultimate', 19900, 365, 10, 'ultimate', true)
ON CONFLICT ("id", "version") DO UPDATE SET
  "name" = EXCLUDED."name",
  "price_usd_cents" = EXCLUDED."price_usd_cents",
  "duration_days" = EXCLUDED."duration_days",
  "max_addresses" = EXCLUDED."max_addresses",
  "tier" = EXCLUDED."tier",
  "is_active" = EXCLUDED."is_active",
  "updated_at" = now();