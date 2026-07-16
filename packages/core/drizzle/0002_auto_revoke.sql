CREATE SCHEMA "auto_revoke";
--> statement-breakpoint
CREATE TYPE "auto_revoke"."risk_sensitivity" AS ENUM('exploits_only', 'high', 'medium');--> statement-breakpoint
CREATE TYPE "auto_revoke"."rules_type" AS ENUM('subscription', 'address');--> statement-breakpoint
CREATE TYPE "auto_revoke"."trigger_type" AS ENUM('exploit', 'stale', 'risk_score');--> statement-breakpoint
CREATE TABLE "auto_revoke"."permissions" (
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
CREATE TABLE "auto_revoke"."rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "auto_revoke"."rules_type" NOT NULL,
	"subscription_id" uuid,
	"address" text,
	"active_rules_id" uuid,
	"risk_detection_enabled" boolean DEFAULT true NOT NULL,
	"risk_sensitivity" "auto_revoke"."risk_sensitivity" DEFAULT 'exploits_only' NOT NULL,
	"stale_approval_enabled" boolean DEFAULT false NOT NULL,
	"stale_approval_threshold_days" integer DEFAULT 180 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rules_owner_consistency" CHECK (("auto_revoke"."rules"."type" = 'subscription' AND "auto_revoke"."rules"."subscription_id" IS NOT NULL AND "auto_revoke"."rules"."address" IS NULL)
        OR ("auto_revoke"."rules"."type" = 'address' AND "auto_revoke"."rules"."subscription_id" IS NULL AND "auto_revoke"."rules"."address" IS NOT NULL)),
	CONSTRAINT "rules_pointer_scope" CHECK ("auto_revoke"."rules"."type" = 'address' OR "auto_revoke"."rules"."active_rules_id" IS NULL)
);
--> statement-breakpoint
ALTER TABLE "auto_revoke"."rules" ADD CONSTRAINT "rules_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "premium"."subscriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_revoke"."rules" ADD CONSTRAINT "rules_active_rules_id_rules_id_fk" FOREIGN KEY ("active_rules_id") REFERENCES "auto_revoke"."rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_address_chain_unique" ON "auto_revoke"."permissions" USING btree ("address","chain_id") WHERE "auto_revoke"."permissions"."revoked_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "permissions_permission_context_unique" ON "auto_revoke"."permissions" USING btree ("permission_context");--> statement-breakpoint
CREATE INDEX "idx_permissions_address" ON "auto_revoke"."permissions" USING btree ("address");--> statement-breakpoint
CREATE UNIQUE INDEX "rules_subscription_unique" ON "auto_revoke"."rules" USING btree ("subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rules_address_unique" ON "auto_revoke"."rules" USING btree ("address");--> statement-breakpoint
CREATE INDEX "idx_rules_active_rules" ON "auto_revoke"."rules" USING btree ("active_rules_id");