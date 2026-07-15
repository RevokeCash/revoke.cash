ALTER TABLE "premium"."withdrawal_requests" RENAME TO "refund_requests";--> statement-breakpoint
ALTER TABLE "premium"."refund_requests" RENAME CONSTRAINT "withdrawal_requests_payment_id_payments_id_fk" TO "refund_requests_payment_id_payments_id_fk";--> statement-breakpoint
ALTER INDEX "premium"."idx_withdrawal_requests_payment_unique" RENAME TO "idx_refund_requests_payment_unique";--> statement-breakpoint
ALTER INDEX "premium"."idx_withdrawal_requests_refund_tx_hash_unique" RENAME TO "idx_refund_requests_refund_tx_hash_unique";--> statement-breakpoint
ALTER TYPE "premium"."payment_status" RENAME VALUE 'withdrawn' TO 'refunded';
