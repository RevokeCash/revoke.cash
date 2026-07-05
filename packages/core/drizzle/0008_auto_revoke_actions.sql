CREATE TYPE "auto_revoke"."action_status" AS ENUM('queued', 'blocked_budget', 'blocked_permission', 'submitted', 'succeeded', 'failed', 'skipped');--> statement-breakpoint
CREATE TABLE "auto_revoke"."actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"observation_id" uuid NOT NULL,
	"permission_id" uuid,
	"billed_subscription_id" uuid,
	"chain_id" integer NOT NULL,
	"status" "auto_revoke"."action_status" DEFAULT 'queued' NOT NULL,
	"nonce" integer,
	"signer_address" text,
	"next_retry_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"transaction" jsonb,
	"cost_usd" numeric,
	"error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auto_revoke"."actions" ADD CONSTRAINT "actions_observation_id_observations_id_fk" FOREIGN KEY ("observation_id") REFERENCES "auto_revoke"."observations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_revoke"."actions" ADD CONSTRAINT "actions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "auto_revoke"."permissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_revoke"."actions" ADD CONSTRAINT "actions_billed_subscription_id_subscriptions_id_fk" FOREIGN KEY ("billed_subscription_id") REFERENCES "premium"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "actions_observation_unique" ON "auto_revoke"."actions" USING btree ("observation_id");--> statement-breakpoint
CREATE INDEX "idx_actions_status_retry" ON "auto_revoke"."actions" USING btree ("status","next_retry_at");--> statement-breakpoint
CREATE INDEX "idx_actions_signer_chain_nonce" ON "auto_revoke"."actions" USING btree ("signer_address","chain_id","nonce") WHERE "auto_revoke"."actions"."nonce" is not null;
--> statement-breakpoint
CREATE INDEX "idx_actions_billed_subscription" ON "auto_revoke"."actions" USING btree ("billed_subscription_id","submitted_at") WHERE "auto_revoke"."actions"."billed_subscription_id" is not null;
