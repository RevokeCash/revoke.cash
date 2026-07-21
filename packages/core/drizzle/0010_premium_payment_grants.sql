ALTER TABLE "premium"."payments" ADD COLUMN "granted_by" text;--> statement-breakpoint
ALTER TABLE "premium"."payments" ADD COLUMN "grant_reason" text;--> statement-breakpoint
ALTER TABLE "premium"."payments" ADD COLUMN "granted_duration_days" integer;