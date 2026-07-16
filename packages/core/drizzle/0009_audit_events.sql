CREATE SCHEMA "audit";
--> statement-breakpoint
CREATE TABLE "audit"."events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_address" text NOT NULL,
	"action" text NOT NULL,
	"target_address" text,
	"subscription_id" uuid,
	"chain_id" integer,
	"details" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_audit_events_created" ON "audit"."events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_events_actor_created" ON "audit"."events" USING btree ("actor_address","created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_events_target_created" ON "audit"."events" USING btree ("target_address","created_at") WHERE "audit"."events"."target_address" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_audit_events_subscription_created" ON "audit"."events" USING btree ("subscription_id","created_at") WHERE "audit"."events"."subscription_id" IS NOT NULL;