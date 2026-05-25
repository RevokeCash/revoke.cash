CREATE SCHEMA "indexer";
--> statement-breakpoint
CREATE TABLE "indexer"."block_timestamps" (
	"chain_id" integer NOT NULL,
	"block_number" bigint NOT NULL,
	"timestamp" bigint NOT NULL,
	CONSTRAINT "block_timestamps_pkey" PRIMARY KEY("chain_id","block_number")
);
--> statement-breakpoint
CREATE TABLE "indexer"."events" (
	"chain_id" integer NOT NULL,
	"address" text NOT NULL,
	"transaction_hash" text NOT NULL,
	"transaction_index" integer NOT NULL,
	"log_index" integer NOT NULL,
	"block_number" bigint NOT NULL,
	"topic0" text NOT NULL,
	"topic1" text,
	"topic2" text,
	"topic3" text,
	"data" text NOT NULL,
	"timestamp" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reorged" boolean DEFAULT false NOT NULL,
	CONSTRAINT "events_pkey" PRIMARY KEY("chain_id","transaction_hash","log_index")
) PARTITION BY LIST ("chain_id");
--> statement-breakpoint
CREATE TABLE "indexer"."events_state" (
	"address" text NOT NULL,
	"chain_id" integer NOT NULL,
	"last_scan_at" timestamp with time zone,
	"last_to_block" bigint,
	"max_block_range" bigint,
	"last_event_at" timestamp with time zone,
	"next_run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"disabled_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_state_pkey" PRIMARY KEY("address","chain_id")
);
--> statement-breakpoint
CREATE INDEX "idx_events_topic0" ON "indexer"."events" USING btree ("chain_id","topic0");--> statement-breakpoint
CREATE INDEX "idx_events_topic1" ON "indexer"."events" USING btree ("chain_id","topic1") WHERE "indexer"."events"."topic1" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_events_topic2" ON "indexer"."events" USING btree ("chain_id","topic2") WHERE "indexer"."events"."topic2" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_events_topic3" ON "indexer"."events" USING btree ("chain_id","topic3") WHERE "indexer"."events"."topic3" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_events_unresolved_timestamps" ON "indexer"."events" USING btree ("chain_id","block_number") WHERE "indexer"."events"."timestamp" IS NULL;--> statement-breakpoint
CREATE INDEX "idx_events_state_next_run" ON "indexer"."events_state" USING btree ("next_run_at") WHERE "indexer"."events_state"."disabled_at" IS NULL;--> statement-breakpoint

-- Adding a new chain to ORDERED_CHAINS requires a one-line partition migration. List the
-- partitions missing from the connected database with:
--   packages/core $ yarn env tsx scripts/print-indexer-partitions.ts
CREATE SCHEMA "indexer_partitions";
-- One LIST partition per chain in ORDERED_CHAINS, held in the indexer_partitions schema.
CREATE TABLE "indexer_partitions"."events_1" PARTITION OF "indexer"."events" FOR VALUES IN (1); -- Ethereum
CREATE TABLE "indexer_partitions"."events_56" PARTITION OF "indexer"."events" FOR VALUES IN (56); -- BNB Chain
CREATE TABLE "indexer_partitions"."events_137" PARTITION OF "indexer"."events" FOR VALUES IN (137); -- Polygon
CREATE TABLE "indexer_partitions"."events_8453" PARTITION OF "indexer"."events" FOR VALUES IN (8453); -- Base
CREATE TABLE "indexer_partitions"."events_42161" PARTITION OF "indexer"."events" FOR VALUES IN (42161); -- Arbitrum
CREATE TABLE "indexer_partitions"."events_10" PARTITION OF "indexer"."events" FOR VALUES IN (10); -- Optimism
CREATE TABLE "indexer_partitions"."events_9745" PARTITION OF "indexer"."events" FOR VALUES IN (9745); -- Plasma
CREATE TABLE "indexer_partitions"."events_43114" PARTITION OF "indexer"."events" FOR VALUES IN (43114); -- Avalanche
CREATE TABLE "indexer_partitions"."events_143" PARTITION OF "indexer"."events" FOR VALUES IN (143); -- Monad
CREATE TABLE "indexer_partitions"."events_5000" PARTITION OF "indexer"."events" FOR VALUES IN (5000); -- Mantle
CREATE TABLE "indexer_partitions"."events_57073" PARTITION OF "indexer"."events" FOR VALUES IN (57073); -- Ink
CREATE TABLE "indexer_partitions"."events_747474" PARTITION OF "indexer"."events" FOR VALUES IN (747474); -- Katana
CREATE TABLE "indexer_partitions"."events_14" PARTITION OF "indexer"."events" FOR VALUES IN (14); -- Flare
CREATE TABLE "indexer_partitions"."events_25" PARTITION OF "indexer"."events" FOR VALUES IN (25); -- Cronos
CREATE TABLE "indexer_partitions"."events_59144" PARTITION OF "indexer"."events" FOR VALUES IN (59144); -- Linea
CREATE TABLE "indexer_partitions"."events_4326" PARTITION OF "indexer"."events" FOR VALUES IN (4326); -- MegaETH
CREATE TABLE "indexer_partitions"."events_30" PARTITION OF "indexer"."events" FOR VALUES IN (30); -- Rootstock
CREATE TABLE "indexer_partitions"."events_988" PARTITION OF "indexer"."events" FOR VALUES IN (988); -- Stable
CREATE TABLE "indexer_partitions"."events_146" PARTITION OF "indexer"."events" FOR VALUES IN (146); -- Sonic
CREATE TABLE "indexer_partitions"."events_43111" PARTITION OF "indexer"."events" FOR VALUES IN (43111); -- Hemi
CREATE TABLE "indexer_partitions"."events_80094" PARTITION OF "indexer"."events" FOR VALUES IN (80094); -- Berachain
CREATE TABLE "indexer_partitions"."events_100" PARTITION OF "indexer"."events" FOR VALUES IN (100); -- Gnosis Chain
CREATE TABLE "indexer_partitions"."events_130" PARTITION OF "indexer"."events" FOR VALUES IN (130); -- Unichain
CREATE TABLE "indexer_partitions"."events_1116" PARTITION OF "indexer"."events" FOR VALUES IN (1116); -- CORE
CREATE TABLE "indexer_partitions"."events_1329" PARTITION OF "indexer"."events" FOR VALUES IN (1329); -- Sei
CREATE TABLE "indexer_partitions"."events_98866" PARTITION OF "indexer"."events" FOR VALUES IN (98866); -- Plume
CREATE TABLE "indexer_partitions"."events_369" PARTITION OF "indexer"."events" FOR VALUES IN (369); -- PulseChain
CREATE TABLE "indexer_partitions"."events_2741" PARTITION OF "indexer"."events" FOR VALUES IN (2741); -- Abstract
CREATE TABLE "indexer_partitions"."events_34443" PARTITION OF "indexer"."events" FOR VALUES IN (34443); -- Mode
CREATE TABLE "indexer_partitions"."events_81457" PARTITION OF "indexer"."events" FOR VALUES IN (81457); -- Blast
CREATE TABLE "indexer_partitions"."events_324" PARTITION OF "indexer"."events" FOR VALUES IN (324); -- zkSync Era
CREATE TABLE "indexer_partitions"."events_314" PARTITION OF "indexer"."events" FOR VALUES IN (314); -- Filecoin EVM
CREATE TABLE "indexer_partitions"."events_1923" PARTITION OF "indexer"."events" FOR VALUES IN (1923); -- Swellchain
CREATE TABLE "indexer_partitions"."events_167000" PARTITION OF "indexer"."events" FOR VALUES IN (167000); -- Taiko Alethia
CREATE TABLE "indexer_partitions"."events_60808" PARTITION OF "indexer"."events" FOR VALUES IN (60808); -- BOB
CREATE TABLE "indexer_partitions"."events_534352" PARTITION OF "indexer"."events" FOR VALUES IN (534352); -- Scroll
CREATE TABLE "indexer_partitions"."events_480" PARTITION OF "indexer"."events" FOR VALUES IN (480); -- World Chain
CREATE TABLE "indexer_partitions"."events_1729" PARTITION OF "indexer"."events" FOR VALUES IN (1729); -- Reya
CREATE TABLE "indexer_partitions"."events_252" PARTITION OF "indexer"."events" FOR VALUES IN (252); -- Fraxtal
CREATE TABLE "indexer_partitions"."events_2818" PARTITION OF "indexer"."events" FOR VALUES IN (2818); -- Morph
CREATE TABLE "indexer_partitions"."events_1868" PARTITION OF "indexer"."events" FOR VALUES IN (1868); -- Soneium
CREATE TABLE "indexer_partitions"."events_42220" PARTITION OF "indexer"."events" FOR VALUES IN (42220); -- Celo
CREATE TABLE "indexer_partitions"."events_42793" PARTITION OF "indexer"."events" FOR VALUES IN (42793); -- Etherlink
CREATE TABLE "indexer_partitions"."events_1776" PARTITION OF "indexer"."events" FOR VALUES IN (1776); -- Injective
CREATE TABLE "indexer_partitions"."events_1514" PARTITION OF "indexer"."events" FOR VALUES IN (1514); -- Story
CREATE TABLE "indexer_partitions"."events_747" PARTITION OF "indexer"."events" FOR VALUES IN (747); -- Flow EVM
CREATE TABLE "indexer_partitions"."events_239" PARTITION OF "indexer"."events" FOR VALUES IN (239); -- TAC
CREATE TABLE "indexer_partitions"."events_33139" PARTITION OF "indexer"."events" FOR VALUES IN (33139); -- ApeChain
CREATE TABLE "indexer_partitions"."events_48900" PARTITION OF "indexer"."events" FOR VALUES IN (48900); -- Zircuit
CREATE TABLE "indexer_partitions"."events_2020" PARTITION OF "indexer"."events" FOR VALUES IN (2020); -- Ronin
CREATE TABLE "indexer_partitions"."events_232" PARTITION OF "indexer"."events" FOR VALUES IN (232); -- Lens
CREATE TABLE "indexer_partitions"."events_204" PARTITION OF "indexer"."events" FOR VALUES IN (204); -- opBNB
CREATE TABLE "indexer_partitions"."events_4114" PARTITION OF "indexer"."events" FOR VALUES IN (4114); -- Citrea
CREATE TABLE "indexer_partitions"."events_50" PARTITION OF "indexer"."events" FOR VALUES IN (50); -- XDC
CREATE TABLE "indexer_partitions"."events_13371" PARTITION OF "indexer"."events" FOR VALUES IN (13371); -- Immutable zkEVM
CREATE TABLE "indexer_partitions"."events_42170" PARTITION OF "indexer"."events" FOR VALUES IN (42170); -- Arbitrum Nova
CREATE TABLE "indexer_partitions"."events_1088" PARTITION OF "indexer"."events" FOR VALUES IN (1088); -- Metis
CREATE TABLE "indexer_partitions"."events_169" PARTITION OF "indexer"."events" FOR VALUES IN (169); -- Manta Pacific
CREATE TABLE "indexer_partitions"."events_1135" PARTITION OF "indexer"."events" FOR VALUES IN (1135); -- Lisk
CREATE TABLE "indexer_partitions"."events_19" PARTITION OF "indexer"."events" FOR VALUES IN (19); -- Songbird
CREATE TABLE "indexer_partitions"."events_8822" PARTITION OF "indexer"."events" FOR VALUES IN (8822); -- IOTA EVM
CREATE TABLE "indexer_partitions"."events_592" PARTITION OF "indexer"."events" FOR VALUES IN (592); -- Astar
CREATE TABLE "indexer_partitions"."events_999" PARTITION OF "indexer"."events" FOR VALUES IN (999); -- Hyperliquid EVM
CREATE TABLE "indexer_partitions"."events_40" PARTITION OF "indexer"."events" FOR VALUES IN (40); -- Telos EVM
CREATE TABLE "indexer_partitions"."events_50104" PARTITION OF "indexer"."events" FOR VALUES IN (50104); -- Sophon
CREATE TABLE "indexer_partitions"."events_570" PARTITION OF "indexer"."events" FOR VALUES IN (570); -- Rollux
CREATE TABLE "indexer_partitions"."events_57" PARTITION OF "indexer"."events" FOR VALUES IN (57); -- Syscoin
CREATE TABLE "indexer_partitions"."events_7000" PARTITION OF "indexer"."events" FOR VALUES IN (7000); -- ZetaChain
CREATE TABLE "indexer_partitions"."events_1313161554" PARTITION OF "indexer"."events" FOR VALUES IN (1313161554); -- Aurora
CREATE TABLE "indexer_partitions"."events_1284" PARTITION OF "indexer"."events" FOR VALUES IN (1284); -- Moonbeam
CREATE TABLE "indexer_partitions"."events_1285" PARTITION OF "indexer"."events" FOR VALUES IN (1285); -- Moonriver
CREATE TABLE "indexer_partitions"."events_288" PARTITION OF "indexer"."events" FOR VALUES IN (288); -- Boba
CREATE TABLE "indexer_partitions"."events_177" PARTITION OF "indexer"."events" FOR VALUES IN (177); -- HashKey Chain
CREATE TABLE "indexer_partitions"."events_1625" PARTITION OF "indexer"."events" FOR VALUES IN (1625); -- Gravity Alpha
CREATE TABLE "indexer_partitions"."events_88888" PARTITION OF "indexer"."events" FOR VALUES IN (88888); -- Chiliz
CREATE TABLE "indexer_partitions"."events_2000" PARTITION OF "indexer"."events" FOR VALUES IN (2000); -- Dogechain
CREATE TABLE "indexer_partitions"."events_4337" PARTITION OF "indexer"."events" FOR VALUES IN (4337); -- Beam
CREATE TABLE "indexer_partitions"."events_38833" PARTITION OF "indexer"."events" FOR VALUES IN (38833); -- Igra Network
CREATE TABLE "indexer_partitions"."events_5031" PARTITION OF "indexer"."events" FOR VALUES IN (5031); -- Somnia
CREATE TABLE "indexer_partitions"."events_88" PARTITION OF "indexer"."events" FOR VALUES IN (88); -- Viction
CREATE TABLE "indexer_partitions"."events_41923" PARTITION OF "indexer"."events" FOR VALUES IN (41923); -- EDU Chain
CREATE TABLE "indexer_partitions"."events_1666600000" PARTITION OF "indexer"."events" FOR VALUES IN (1666600000); -- Harmony
CREATE TABLE "indexer_partitions"."events_666666666" PARTITION OF "indexer"."events" FOR VALUES IN (666666666); -- Degen Chain
CREATE TABLE "indexer_partitions"."events_248" PARTITION OF "indexer"."events" FOR VALUES IN (248); -- Oasys
CREATE TABLE "indexer_partitions"."events_1480" PARTITION OF "indexer"."events" FOR VALUES IN (1480); -- Vana
CREATE TABLE "indexer_partitions"."events_321" PARTITION OF "indexer"."events" FOR VALUES IN (321); -- KCC
CREATE TABLE "indexer_partitions"."events_122" PARTITION OF "indexer"."events" FOR VALUES IN (122); -- Fuse
CREATE TABLE "indexer_partitions"."events_52" PARTITION OF "indexer"."events" FOR VALUES IN (52); -- CoinEx Smart Chain
CREATE TABLE "indexer_partitions"."events_543210" PARTITION OF "indexer"."events" FOR VALUES IN (543210); -- ZERϴ
CREATE TABLE "indexer_partitions"."events_245022934" PARTITION OF "indexer"."events" FOR VALUES IN (245022934); -- Neon
CREATE TABLE "indexer_partitions"."events_106" PARTITION OF "indexer"."events" FOR VALUES IN (106); -- Velas
CREATE TABLE "indexer_partitions"."events_20" PARTITION OF "indexer"."events" FOR VALUES IN (20); -- Elastos
CREATE TABLE "indexer_partitions"."events_148" PARTITION OF "indexer"."events" FOR VALUES IN (148); -- Shimmer
CREATE TABLE "indexer_partitions"."events_199" PARTITION OF "indexer"."events" FOR VALUES IN (199); -- BTT Chain
CREATE TABLE "indexer_partitions"."events_61" PARTITION OF "indexer"."events" FOR VALUES IN (61); -- Ethereum Classic
CREATE TABLE "indexer_partitions"."events_964" PARTITION OF "indexer"."events" FOR VALUES IN (964); -- Bittensor EVM
CREATE TABLE "indexer_partitions"."events_1890" PARTITION OF "indexer"."events" FOR VALUES IN (1890); -- Lightlink
CREATE TABLE "indexer_partitions"."events_360" PARTITION OF "indexer"."events" FOR VALUES IN (360); -- Shape
CREATE TABLE "indexer_partitions"."events_46" PARTITION OF "indexer"."events" FOR VALUES IN (46); -- Darwinia
CREATE TABLE "indexer_partitions"."events_55244" PARTITION OF "indexer"."events" FOR VALUES IN (55244); -- Superposition
CREATE TABLE "indexer_partitions"."events_4061" PARTITION OF "indexer"."events" FOR VALUES IN (4061); -- Nahmii
CREATE TABLE "indexer_partitions"."events_9008" PARTITION OF "indexer"."events" FOR VALUES IN (9008); -- Shido
CREATE TABLE "indexer_partitions"."events_698" PARTITION OF "indexer"."events" FOR VALUES IN (698); -- Matchain
CREATE TABLE "indexer_partitions"."events_1380012617" PARTITION OF "indexer"."events" FOR VALUES IN (1380012617); -- RARI Chain
CREATE TABLE "indexer_partitions"."events_47763" PARTITION OF "indexer"."events" FOR VALUES IN (47763); -- Neo X
CREATE TABLE "indexer_partitions"."events_32520" PARTITION OF "indexer"."events" FOR VALUES IN (32520); -- Bitgert
CREATE TABLE "indexer_partitions"."events_2109" PARTITION OF "indexer"."events" FOR VALUES IN (2109); -- Exosama
CREATE TABLE "indexer_partitions"."events_800001" PARTITION OF "indexer"."events" FOR VALUES IN (800001); -- OctaSpace
CREATE TABLE "indexer_partitions"."events_202555" PARTITION OF "indexer"."events" FOR VALUES IN (202555); -- Kasplex zkEVM
CREATE TABLE "indexer_partitions"."events_11155111" PARTITION OF "indexer"."events" FOR VALUES IN (11155111); -- Ethereum Sepolia
CREATE TABLE "indexer_partitions"."events_97" PARTITION OF "indexer"."events" FOR VALUES IN (97); -- BNB Chain Testnet
CREATE TABLE "indexer_partitions"."events_80002" PARTITION OF "indexer"."events" FOR VALUES IN (80002); -- Polygon Amoy
CREATE TABLE "indexer_partitions"."events_11155420" PARTITION OF "indexer"."events" FOR VALUES IN (11155420); -- Optimism Sepolia
CREATE TABLE "indexer_partitions"."events_421614" PARTITION OF "indexer"."events" FOR VALUES IN (421614); -- Arbitrum Sepolia
CREATE TABLE "indexer_partitions"."events_84532" PARTITION OF "indexer"."events" FOR VALUES IN (84532); -- Base Sepolia
CREATE TABLE "indexer_partitions"."events_11124" PARTITION OF "indexer"."events" FOR VALUES IN (11124); -- Abstract Testnet
CREATE TABLE "indexer_partitions"."events_43113" PARTITION OF "indexer"."events" FOR VALUES IN (43113); -- Avalanche Fuji
CREATE TABLE "indexer_partitions"."events_338" PARTITION OF "indexer"."events" FOR VALUES IN (338); -- Cronos Testnet
CREATE TABLE "indexer_partitions"."events_11155931" PARTITION OF "indexer"."events" FOR VALUES IN (11155931); -- RISE Testnet
CREATE TABLE "indexer_partitions"."events_8408" PARTITION OF "indexer"."events" FOR VALUES IN (8408); -- ZenChain Testnet
CREATE TABLE "indexer_partitions"."events_824642" PARTITION OF "indexer"."events" FOR VALUES IN (824642); -- ZugChain Testnet
