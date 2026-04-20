CREATE TYPE "public"."auto_revoke_activity_status" AS ENUM('pending', 'executed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."auto_revoke_risk_sensitivity" AS ENUM('exploits_only', 'high', 'medium');--> statement-breakpoint
CREATE TYPE "public"."auto_revoke_rules_type" AS ENUM('subscription', 'address');--> statement-breakpoint
CREATE TYPE "public"."auto_revoke_trigger_type" AS ENUM('exploit', 'stale', 'risk_score');--> statement-breakpoint
CREATE TYPE "public"."premium_plan_tier" AS ENUM('premium', 'ultimate');--> statement-breakpoint
CREATE TABLE "auto_revoke_activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"chain_id" integer NOT NULL,
	"trigger_type" "auto_revoke_trigger_type" NOT NULL,
	"spender_address" text NOT NULL,
	"token_address" text NOT NULL,
	"tx_hash" text,
	"status" "auto_revoke_activity_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_revoke_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"chain_id" integer NOT NULL,
	"permission_context" text NOT NULL,
	"delegation_manager" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_revoke_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "auto_revoke_rules_type" NOT NULL,
	"subscription_id" uuid,
	"address" text,
	"active_rules_id" uuid,
	"risk_detection_enabled" boolean DEFAULT true NOT NULL,
	"risk_sensitivity" "auto_revoke_risk_sensitivity" DEFAULT 'exploits_only' NOT NULL,
	"stale_approval_enabled" boolean DEFAULT false NOT NULL,
	"stale_approval_threshold_days" integer DEFAULT 30,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auto_revoke_rules_owner_consistency" CHECK (("auto_revoke_rules"."type" = 'subscription' AND "auto_revoke_rules"."subscription_id" IS NOT NULL AND "auto_revoke_rules"."address" IS NULL)
        OR ("auto_revoke_rules"."type" = 'address' AND "auto_revoke_rules"."subscription_id" IS NULL AND "auto_revoke_rules"."address" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "premium_plans" ADD COLUMN "tier" "premium_plan_tier" DEFAULT 'premium' NOT NULL;--> statement-breakpoint
ALTER TABLE "auto_revoke_rules" ADD CONSTRAINT "auto_revoke_rules_subscription_id_premium_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."premium_subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_revoke_rules" ADD CONSTRAINT "auto_revoke_rules_active_rules_id_auto_revoke_rules_id_fk" FOREIGN KEY ("active_rules_id") REFERENCES "public"."auto_revoke_rules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_auto_revoke_activity_address" ON "auto_revoke_activity_log" USING btree ("address");--> statement-breakpoint
CREATE INDEX "idx_auto_revoke_activity_created" ON "auto_revoke_activity_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "auto_revoke_permissions_address_chain_unique" ON "auto_revoke_permissions" USING btree ("address","chain_id") WHERE "auto_revoke_permissions"."revoked_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "auto_revoke_permissions_permission_context_unique" ON "auto_revoke_permissions" USING btree ("permission_context");--> statement-breakpoint
CREATE INDEX "idx_auto_revoke_permissions_address" ON "auto_revoke_permissions" USING btree ("address");--> statement-breakpoint
CREATE UNIQUE INDEX "auto_revoke_rules_subscription_unique" ON "auto_revoke_rules" USING btree ("subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "auto_revoke_rules_address_unique" ON "auto_revoke_rules" USING btree ("address");--> statement-breakpoint
CREATE INDEX "idx_auto_revoke_rules_active_rules" ON "auto_revoke_rules" USING btree ("active_rules_id");

DELETE FROM "premium_plans" WHERE "id" IN ('individual_annual', 'bundle10_annual');--> statement-breakpoint

INSERT INTO "premium_plans" ("id", "version", "name", "price_usd", "duration_days", "max_addresses", "tier", "is_active")
VALUES
  ('premium_annual', 1, 'Premium', 99, 365, 10, 'premium', true),
  ('ultimate_annual', 1, 'Ultimate', 199, 365, 10, 'ultimate', true)
ON CONFLICT ("id", "version") DO UPDATE SET
  "name" = EXCLUDED."name",
  "price_usd" = EXCLUDED."price_usd",
  "duration_days" = EXCLUDED."duration_days",
  "max_addresses" = EXCLUDED."max_addresses",
  "tier" = EXCLUDED."tier",
  "is_active" = EXCLUDED."is_active",
  "updated_at" = now();
