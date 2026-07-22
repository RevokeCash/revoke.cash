ALTER TABLE "batch_revokes" ALTER COLUMN "user_address" SET DATA TYPE text;--> statement-breakpoint
UPDATE "batch_revokes" SET "user_address" = lower("user_address") WHERE "user_address" IS NOT NULL AND "user_address" <> lower("user_address");
