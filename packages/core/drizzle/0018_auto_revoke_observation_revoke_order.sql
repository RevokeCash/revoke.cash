ALTER TABLE "auto_revoke"."observations" ADD COLUMN "token_balance" numeric;--> statement-breakpoint
ALTER TABLE "auto_revoke"."observations" ADD COLUMN "value_at_risk_usd" numeric;--> statement-breakpoint
ALTER TABLE "auto_revoke"."observations" ADD COLUMN "spender_risk_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "auto_revoke"."observations" ADD COLUMN "last_updated_timestamp" bigint;