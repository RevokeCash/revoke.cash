CREATE TABLE "indexer"."spender_metadata" (
	"chain_id" integer NOT NULL,
	"spender_address" text NOT NULL,
	"name" text,
	"risk_factors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"enrichment_error" text,
	"enriched_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "spender_metadata_pkey" PRIMARY KEY("chain_id","spender_address")
);
--> statement-breakpoint
CREATE INDEX "idx_spender_metadata_enriched_at" ON "indexer"."spender_metadata" USING btree ("chain_id","enriched_at");--> statement-breakpoint
CREATE INDEX "idx_spender_metadata_unenriched" ON "indexer"."spender_metadata" USING btree ("chain_id","spender_address") WHERE "indexer"."spender_metadata"."enriched_at" IS NULL;