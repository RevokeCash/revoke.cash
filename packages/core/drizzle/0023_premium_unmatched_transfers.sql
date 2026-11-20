CREATE TABLE "premium"."unmatched_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain_id" integer NOT NULL,
	"transaction_hash" text NOT NULL,
	"log_index" integer NOT NULL,
	"token_address" text NOT NULL,
	"token_symbol" text NOT NULL,
	"token_decimals" integer NOT NULL,
	"sender_address" text NOT NULL,
	"amount" numeric NOT NULL,
	"note" text,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "idx_unmatched_transfers_transfer_unique" ON "premium"."unmatched_transfers" USING btree ("chain_id","transaction_hash","log_index");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_plans_active_by_price_unique" ON "premium"."plans" USING btree ("price_usd_cents") WHERE "premium"."plans"."is_active" IS TRUE;--> statement-breakpoint

-- A payment can now be paid for 48 hours after it was created, and at most one payment can be pending per
-- owner, chain, token and amount. The statements below bring the pending payments in line with both rules
-- before the unique index is created. They only touch pending payments, which never have a subscription.
UPDATE "premium"."payments" SET "status" = 'expired' WHERE "status" = 'pending' AND "created_at" <= now() - interval '48 hours';--> statement-breakpoint

-- Of several pending payments with the same owner, chain, token and amount, only the newest stays pending
UPDATE "premium"."payments" AS "older" SET "status" = 'expired'
FROM "premium"."payments" AS "newer"
WHERE "older"."status" = 'pending'
  AND "newer"."status" = 'pending'
  AND "newer"."owner_address" = "older"."owner_address"
  AND "newer"."chain_id" = "older"."chain_id"
  AND "newer"."token_address" = "older"."token_address"
  AND "newer"."amount_usd_cents" = "older"."amount_usd_cents"
  AND ("newer"."created_at", "newer"."id") > ("older"."created_at", "older"."id");--> statement-breakpoint

UPDATE "premium"."payments" SET "expires_at" = "created_at" + interval '48 hours' WHERE "status" = 'pending';--> statement-breakpoint

CREATE UNIQUE INDEX "idx_payments_pending_unique" ON "premium"."payments" USING btree ("owner_address","chain_id","token_address","amount_usd_cents") WHERE "premium"."payments"."status" = 'pending';--> statement-breakpoint

-- scan_from_block is no longer read or written. The code running before this deploy still names the column in its
-- checkout, payment status, cron, refund and admin queries, so those fail from the moment this migration is applied
-- until the new code is live. Apply this migration right before the new code goes live.
DROP INDEX "premium"."idx_payments_chain_scan_start";--> statement-breakpoint
ALTER TABLE "premium"."payments" DROP COLUMN "scan_from_block";
