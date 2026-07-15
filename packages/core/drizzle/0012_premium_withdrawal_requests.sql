ALTER TYPE "premium"."payment_status" ADD VALUE 'withdrawn';--> statement-breakpoint
CREATE TABLE "premium"."withdrawal_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"refund_amount_usd_cents" integer NOT NULL,
	"refund_tx_hash" text,
	"processed_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "premium"."withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "premium"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_withdrawal_requests_payment_unique" ON "premium"."withdrawal_requests" USING btree ("payment_id") WHERE "premium"."withdrawal_requests"."dismissed_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_withdrawal_requests_refund_tx_hash_unique" ON "premium"."withdrawal_requests" USING btree ("refund_tx_hash") WHERE "premium"."withdrawal_requests"."refund_tx_hash" IS NOT NULL;