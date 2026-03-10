CREATE TYPE "public"."premium_payment_status" AS ENUM('pending', 'confirmed', 'expired', 'failed');--> statement-breakpoint
CREATE TABLE "premium_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" text NOT NULL,
	"plan_version" integer NOT NULL,
	"owner_address" text NOT NULL,
	"subscription_id" uuid,
	"chain_id" integer NOT NULL,
	"token_address" text NOT NULL,
	"token_symbol" text NOT NULL,
	"token_decimals" integer NOT NULL,
	"amount_usd" integer NOT NULL,
	"status" "premium_payment_status" NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"scan_from_block" bigint NOT NULL,
	"matched_tx_hash" text,
	"vat_region" char(2),
	"confirmed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "premium_plans" (
	"id" text NOT NULL,
	"version" integer NOT NULL,
	"name" text NOT NULL,
	"price_usd" integer NOT NULL,
	"duration_days" integer NOT NULL,
	"max_addresses" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "premium_plans_pkey" PRIMARY KEY("id","version")
);
--> statement-breakpoint
CREATE TABLE "premium_subscription_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"address" text NOT NULL,
	"added_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "premium_subscriptions" (
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
ALTER TABLE "premium_payments" ADD CONSTRAINT "premium_payments_subscription_id_premium_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."premium_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premium_payments" ADD CONSTRAINT "premium_payments_plan_fk" FOREIGN KEY ("plan_id","plan_version") REFERENCES "public"."premium_plans"("id","version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premium_subscription_addresses" ADD CONSTRAINT "premium_subscription_addresses_subscription_id_premium_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."premium_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "premium_subscriptions" ADD CONSTRAINT "premium_subscriptions_plan_fk" FOREIGN KEY ("plan_id","plan_version") REFERENCES "public"."premium_plans"("id","version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_premium_payments_owner" ON "premium_payments" USING btree ("owner_address");--> statement-breakpoint
CREATE INDEX "idx_premium_payments_status" ON "premium_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_premium_payments_chain_scan_start" ON "premium_payments" USING btree ("chain_id","scan_from_block");--> statement-breakpoint
CREATE INDEX "idx_premium_payments_subscription" ON "premium_payments" USING btree ("subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_premium_payments_matched_tx_hash_unique" ON "premium_payments" USING btree ("matched_tx_hash") WHERE "premium_payments"."matched_tx_hash" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_premium_payments_confirmed_at" ON "premium_payments" USING btree ("confirmed_at");--> statement-breakpoint
CREATE INDEX "idx_premium_plans_active" ON "premium_plans" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_premium_plans_active_by_id_unique" ON "premium_plans" USING btree ("id") WHERE "premium_plans"."is_active" IS TRUE;--> statement-breakpoint
CREATE UNIQUE INDEX "premium_subscription_addresses_subscription_address_unique" ON "premium_subscription_addresses" USING btree ("subscription_id","address");--> statement-breakpoint
CREATE INDEX "idx_premium_subscription_addresses_address" ON "premium_subscription_addresses" USING btree ("address");--> statement-breakpoint
CREATE INDEX "idx_premium_subscriptions_owner" ON "premium_subscriptions" USING btree ("owner_address");--> statement-breakpoint
CREATE INDEX "idx_premium_subscriptions_ends" ON "premium_subscriptions" USING btree ("ends_at");

INSERT INTO "premium_plans" ("id", "version", "name", "price_usd", "duration_days", "max_addresses", "is_active")
VALUES
  ('individual_annual', 1, 'Premium Individual', 1, 365, 1, true),
  ('bundle10_annual', 1, 'Premium Bundle (10)', 3, 365, 10, true)
ON CONFLICT ("id", "version") DO UPDATE SET
  "name" = EXCLUDED."name",
  "price_usd" = EXCLUDED."price_usd",
  "duration_days" = EXCLUDED."duration_days",
  "max_addresses" = EXCLUDED."max_addresses",
  "is_active" = EXCLUDED."is_active",
  "updated_at" = now();
