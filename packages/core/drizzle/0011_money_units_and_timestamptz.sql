ALTER TABLE "premium"."plans" RENAME COLUMN "price_usd" TO "price_usd_cents";--> statement-breakpoint
ALTER TABLE "premium"."payments" RENAME COLUMN "amount_usd" TO "amount_usd_cents";--> statement-breakpoint
ALTER TABLE "batch_revokes" RENAME COLUMN "fee_paid" TO "fee_usd_cents";--> statement-breakpoint
UPDATE "premium"."plans" SET "price_usd_cents" = "price_usd_cents" * 100;--> statement-breakpoint
UPDATE "premium"."payments" SET "amount_usd_cents" = "amount_usd_cents" * 100;--> statement-breakpoint

-- Existing values are naive UTC wall-clock times (written via toISOString / now() under UTC),
-- so they are reinterpreted explicitly as UTC rather than relying on the session timezone.
ALTER TABLE "batch_revokes" ALTER COLUMN "timestamp" SET DATA TYPE timestamp with time zone USING "timestamp" AT TIME ZONE 'UTC';
