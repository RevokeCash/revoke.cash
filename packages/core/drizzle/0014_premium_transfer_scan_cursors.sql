CREATE TABLE "premium"."transfer_scan_cursors" (
	"chain_id" integer PRIMARY KEY NOT NULL,
	"last_scanned_block" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
