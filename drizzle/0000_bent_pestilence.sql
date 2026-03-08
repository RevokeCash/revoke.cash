CREATE TABLE "batch_revokes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "batch_revokes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"chain_id" integer NOT NULL,
	"fee_transaction_hash" char(66),
	"fee_paid" integer NOT NULL,
	"is_testnet" boolean NOT NULL,
	"vat_region" char(2),
	"sponsor" text,
	"notes" text,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"user_address" varchar(42)
);
