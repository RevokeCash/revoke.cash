CREATE SCHEMA "monitor";
--> statement-breakpoint
CREATE SCHEMA "monitor_partitions";
--> statement-breakpoint
CREATE TABLE "monitor"."events_cache" (
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
	CONSTRAINT "events_cache_pkey" PRIMARY KEY("chain_id","transaction_hash","log_index")
) PARTITION BY LIST ("chain_id");
--> statement-breakpoint
CREATE TABLE "monitor"."scan_state" (
	"address" text NOT NULL,
	"chain_id" integer NOT NULL,
	"last_scan_at" timestamp with time zone,
	"last_to_block" bigint,
	"last_event_at" timestamp with time zone,
	"next_run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"disabled_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scan_state_pkey" PRIMARY KEY("address","chain_id")
);
--> statement-breakpoint
CREATE INDEX "idx_events_cache_topic0" ON "monitor"."events_cache" USING btree ("chain_id","topic0");--> statement-breakpoint
CREATE INDEX "idx_events_cache_topic1" ON "monitor"."events_cache" USING btree ("chain_id","topic1") WHERE "monitor"."events_cache"."topic1" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_events_cache_topic2" ON "monitor"."events_cache" USING btree ("chain_id","topic2") WHERE "monitor"."events_cache"."topic2" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_events_cache_topic3" ON "monitor"."events_cache" USING btree ("chain_id","topic3") WHERE "monitor"."events_cache"."topic3" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_scan_state_next_run" ON "monitor"."scan_state" USING btree ("next_run_at") WHERE "monitor"."scan_state"."disabled_at" IS NULL;

-- One LIST partition per chain in ORDERED_CHAINS, held in the monitor_partitions schema.
-- When adding a new chain to ORDERED_CHAINS, create a new partition in a follow-up migration.
-- Helper that prints only the partitions missing from the connected database:
--   packages/core $ yarn env tsx scripts/print-monitor-partitions.ts
CREATE TABLE "monitor_partitions"."events_cache_1" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1); -- Ethereum
CREATE TABLE "monitor_partitions"."events_cache_56" PARTITION OF "monitor"."events_cache" FOR VALUES IN (56); -- BNB Chain
CREATE TABLE "monitor_partitions"."events_cache_137" PARTITION OF "monitor"."events_cache" FOR VALUES IN (137); -- Polygon
CREATE TABLE "monitor_partitions"."events_cache_8453" PARTITION OF "monitor"."events_cache" FOR VALUES IN (8453); -- Base
CREATE TABLE "monitor_partitions"."events_cache_42161" PARTITION OF "monitor"."events_cache" FOR VALUES IN (42161); -- Arbitrum
CREATE TABLE "monitor_partitions"."events_cache_10" PARTITION OF "monitor"."events_cache" FOR VALUES IN (10); -- Optimism
CREATE TABLE "monitor_partitions"."events_cache_9745" PARTITION OF "monitor"."events_cache" FOR VALUES IN (9745); -- Plasma
CREATE TABLE "monitor_partitions"."events_cache_43114" PARTITION OF "monitor"."events_cache" FOR VALUES IN (43114); -- Avalanche
CREATE TABLE "monitor_partitions"."events_cache_143" PARTITION OF "monitor"."events_cache" FOR VALUES IN (143); -- Monad
CREATE TABLE "monitor_partitions"."events_cache_5000" PARTITION OF "monitor"."events_cache" FOR VALUES IN (5000); -- Mantle
CREATE TABLE "monitor_partitions"."events_cache_57073" PARTITION OF "monitor"."events_cache" FOR VALUES IN (57073); -- Ink
CREATE TABLE "monitor_partitions"."events_cache_747474" PARTITION OF "monitor"."events_cache" FOR VALUES IN (747474); -- Katana
CREATE TABLE "monitor_partitions"."events_cache_14" PARTITION OF "monitor"."events_cache" FOR VALUES IN (14); -- Flare
CREATE TABLE "monitor_partitions"."events_cache_25" PARTITION OF "monitor"."events_cache" FOR VALUES IN (25); -- Cronos
CREATE TABLE "monitor_partitions"."events_cache_59144" PARTITION OF "monitor"."events_cache" FOR VALUES IN (59144); -- Linea
CREATE TABLE "monitor_partitions"."events_cache_4326" PARTITION OF "monitor"."events_cache" FOR VALUES IN (4326); -- MegaETH
CREATE TABLE "monitor_partitions"."events_cache_30" PARTITION OF "monitor"."events_cache" FOR VALUES IN (30); -- Rootstock
CREATE TABLE "monitor_partitions"."events_cache_988" PARTITION OF "monitor"."events_cache" FOR VALUES IN (988); -- Stable
CREATE TABLE "monitor_partitions"."events_cache_146" PARTITION OF "monitor"."events_cache" FOR VALUES IN (146); -- Sonic
CREATE TABLE "monitor_partitions"."events_cache_43111" PARTITION OF "monitor"."events_cache" FOR VALUES IN (43111); -- Hemi
CREATE TABLE "monitor_partitions"."events_cache_80094" PARTITION OF "monitor"."events_cache" FOR VALUES IN (80094); -- Berachain
CREATE TABLE "monitor_partitions"."events_cache_100" PARTITION OF "monitor"."events_cache" FOR VALUES IN (100); -- Gnosis Chain
CREATE TABLE "monitor_partitions"."events_cache_130" PARTITION OF "monitor"."events_cache" FOR VALUES IN (130); -- Unichain
CREATE TABLE "monitor_partitions"."events_cache_1116" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1116); -- CORE
CREATE TABLE "monitor_partitions"."events_cache_1329" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1329); -- Sei
CREATE TABLE "monitor_partitions"."events_cache_98866" PARTITION OF "monitor"."events_cache" FOR VALUES IN (98866); -- Plume
CREATE TABLE "monitor_partitions"."events_cache_369" PARTITION OF "monitor"."events_cache" FOR VALUES IN (369); -- PulseChain
CREATE TABLE "monitor_partitions"."events_cache_2741" PARTITION OF "monitor"."events_cache" FOR VALUES IN (2741); -- Abstract
CREATE TABLE "monitor_partitions"."events_cache_34443" PARTITION OF "monitor"."events_cache" FOR VALUES IN (34443); -- Mode
CREATE TABLE "monitor_partitions"."events_cache_81457" PARTITION OF "monitor"."events_cache" FOR VALUES IN (81457); -- Blast
CREATE TABLE "monitor_partitions"."events_cache_324" PARTITION OF "monitor"."events_cache" FOR VALUES IN (324); -- zkSync Era
CREATE TABLE "monitor_partitions"."events_cache_314" PARTITION OF "monitor"."events_cache" FOR VALUES IN (314); -- Filecoin EVM
CREATE TABLE "monitor_partitions"."events_cache_1923" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1923); -- Swellchain
CREATE TABLE "monitor_partitions"."events_cache_167000" PARTITION OF "monitor"."events_cache" FOR VALUES IN (167000); -- Taiko Alethia
CREATE TABLE "monitor_partitions"."events_cache_60808" PARTITION OF "monitor"."events_cache" FOR VALUES IN (60808); -- BOB
CREATE TABLE "monitor_partitions"."events_cache_534352" PARTITION OF "monitor"."events_cache" FOR VALUES IN (534352); -- Scroll
CREATE TABLE "monitor_partitions"."events_cache_480" PARTITION OF "monitor"."events_cache" FOR VALUES IN (480); -- World Chain
CREATE TABLE "monitor_partitions"."events_cache_1729" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1729); -- Reya
CREATE TABLE "monitor_partitions"."events_cache_252" PARTITION OF "monitor"."events_cache" FOR VALUES IN (252); -- Fraxtal
CREATE TABLE "monitor_partitions"."events_cache_2818" PARTITION OF "monitor"."events_cache" FOR VALUES IN (2818); -- Morph
CREATE TABLE "monitor_partitions"."events_cache_1868" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1868); -- Soneium
CREATE TABLE "monitor_partitions"."events_cache_42220" PARTITION OF "monitor"."events_cache" FOR VALUES IN (42220); -- Celo
CREATE TABLE "monitor_partitions"."events_cache_42793" PARTITION OF "monitor"."events_cache" FOR VALUES IN (42793); -- Etherlink
CREATE TABLE "monitor_partitions"."events_cache_1776" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1776); -- Injective
CREATE TABLE "monitor_partitions"."events_cache_1514" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1514); -- Story
CREATE TABLE "monitor_partitions"."events_cache_747" PARTITION OF "monitor"."events_cache" FOR VALUES IN (747); -- Flow EVM
CREATE TABLE "monitor_partitions"."events_cache_239" PARTITION OF "monitor"."events_cache" FOR VALUES IN (239); -- TAC
CREATE TABLE "monitor_partitions"."events_cache_33139" PARTITION OF "monitor"."events_cache" FOR VALUES IN (33139); -- ApeChain
CREATE TABLE "monitor_partitions"."events_cache_48900" PARTITION OF "monitor"."events_cache" FOR VALUES IN (48900); -- Zircuit
CREATE TABLE "monitor_partitions"."events_cache_2020" PARTITION OF "monitor"."events_cache" FOR VALUES IN (2020); -- Ronin
CREATE TABLE "monitor_partitions"."events_cache_232" PARTITION OF "monitor"."events_cache" FOR VALUES IN (232); -- Lens
CREATE TABLE "monitor_partitions"."events_cache_204" PARTITION OF "monitor"."events_cache" FOR VALUES IN (204); -- opBNB
CREATE TABLE "monitor_partitions"."events_cache_4114" PARTITION OF "monitor"."events_cache" FOR VALUES IN (4114); -- Citrea
CREATE TABLE "monitor_partitions"."events_cache_50" PARTITION OF "monitor"."events_cache" FOR VALUES IN (50); -- XDC
CREATE TABLE "monitor_partitions"."events_cache_13371" PARTITION OF "monitor"."events_cache" FOR VALUES IN (13371); -- Immutable zkEVM
CREATE TABLE "monitor_partitions"."events_cache_42170" PARTITION OF "monitor"."events_cache" FOR VALUES IN (42170); -- Arbitrum Nova
CREATE TABLE "monitor_partitions"."events_cache_1088" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1088); -- Metis
CREATE TABLE "monitor_partitions"."events_cache_169" PARTITION OF "monitor"."events_cache" FOR VALUES IN (169); -- Manta Pacific
CREATE TABLE "monitor_partitions"."events_cache_1135" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1135); -- Lisk
CREATE TABLE "monitor_partitions"."events_cache_19" PARTITION OF "monitor"."events_cache" FOR VALUES IN (19); -- Songbird
CREATE TABLE "monitor_partitions"."events_cache_8822" PARTITION OF "monitor"."events_cache" FOR VALUES IN (8822); -- IOTA EVM
CREATE TABLE "monitor_partitions"."events_cache_592" PARTITION OF "monitor"."events_cache" FOR VALUES IN (592); -- Astar
CREATE TABLE "monitor_partitions"."events_cache_999" PARTITION OF "monitor"."events_cache" FOR VALUES IN (999); -- Hyperliquid EVM
CREATE TABLE "monitor_partitions"."events_cache_40" PARTITION OF "monitor"."events_cache" FOR VALUES IN (40); -- Telos EVM
CREATE TABLE "monitor_partitions"."events_cache_50104" PARTITION OF "monitor"."events_cache" FOR VALUES IN (50104); -- Sophon
CREATE TABLE "monitor_partitions"."events_cache_570" PARTITION OF "monitor"."events_cache" FOR VALUES IN (570); -- Rollux
CREATE TABLE "monitor_partitions"."events_cache_57" PARTITION OF "monitor"."events_cache" FOR VALUES IN (57); -- Syscoin
CREATE TABLE "monitor_partitions"."events_cache_7000" PARTITION OF "monitor"."events_cache" FOR VALUES IN (7000); -- ZetaChain
CREATE TABLE "monitor_partitions"."events_cache_1313161554" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1313161554); -- Aurora
CREATE TABLE "monitor_partitions"."events_cache_1284" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1284); -- Moonbeam
CREATE TABLE "monitor_partitions"."events_cache_1285" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1285); -- Moonriver
CREATE TABLE "monitor_partitions"."events_cache_288" PARTITION OF "monitor"."events_cache" FOR VALUES IN (288); -- Boba
CREATE TABLE "monitor_partitions"."events_cache_177" PARTITION OF "monitor"."events_cache" FOR VALUES IN (177); -- HashKey Chain
CREATE TABLE "monitor_partitions"."events_cache_1625" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1625); -- Gravity Alpha
CREATE TABLE "monitor_partitions"."events_cache_185" PARTITION OF "monitor"."events_cache" FOR VALUES IN (185); -- Mint
CREATE TABLE "monitor_partitions"."events_cache_88888" PARTITION OF "monitor"."events_cache" FOR VALUES IN (88888); -- Chiliz
CREATE TABLE "monitor_partitions"."events_cache_2000" PARTITION OF "monitor"."events_cache" FOR VALUES IN (2000); -- Dogechain
CREATE TABLE "monitor_partitions"."events_cache_4337" PARTITION OF "monitor"."events_cache" FOR VALUES IN (4337); -- Beam
CREATE TABLE "monitor_partitions"."events_cache_38833" PARTITION OF "monitor"."events_cache" FOR VALUES IN (38833); -- Igra Network
CREATE TABLE "monitor_partitions"."events_cache_5031" PARTITION OF "monitor"."events_cache" FOR VALUES IN (5031); -- Somnia
CREATE TABLE "monitor_partitions"."events_cache_88" PARTITION OF "monitor"."events_cache" FOR VALUES IN (88); -- Viction
CREATE TABLE "monitor_partitions"."events_cache_41923" PARTITION OF "monitor"."events_cache" FOR VALUES IN (41923); -- EDU Chain
CREATE TABLE "monitor_partitions"."events_cache_1666600000" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1666600000); -- Harmony
CREATE TABLE "monitor_partitions"."events_cache_666666666" PARTITION OF "monitor"."events_cache" FOR VALUES IN (666666666); -- Degen Chain
CREATE TABLE "monitor_partitions"."events_cache_248" PARTITION OF "monitor"."events_cache" FOR VALUES IN (248); -- Oasys
CREATE TABLE "monitor_partitions"."events_cache_1480" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1480); -- Vana
CREATE TABLE "monitor_partitions"."events_cache_321" PARTITION OF "monitor"."events_cache" FOR VALUES IN (321); -- KCC
CREATE TABLE "monitor_partitions"."events_cache_122" PARTITION OF "monitor"."events_cache" FOR VALUES IN (122); -- Fuse
CREATE TABLE "monitor_partitions"."events_cache_52" PARTITION OF "monitor"."events_cache" FOR VALUES IN (52); -- CoinEx Smart Chain
CREATE TABLE "monitor_partitions"."events_cache_543210" PARTITION OF "monitor"."events_cache" FOR VALUES IN (543210); -- ZERϴ
CREATE TABLE "monitor_partitions"."events_cache_245022934" PARTITION OF "monitor"."events_cache" FOR VALUES IN (245022934); -- Neon
CREATE TABLE "monitor_partitions"."events_cache_106" PARTITION OF "monitor"."events_cache" FOR VALUES IN (106); -- Velas
CREATE TABLE "monitor_partitions"."events_cache_20" PARTITION OF "monitor"."events_cache" FOR VALUES IN (20); -- Elastos
CREATE TABLE "monitor_partitions"."events_cache_148" PARTITION OF "monitor"."events_cache" FOR VALUES IN (148); -- Shimmer
CREATE TABLE "monitor_partitions"."events_cache_199" PARTITION OF "monitor"."events_cache" FOR VALUES IN (199); -- BTT Chain
CREATE TABLE "monitor_partitions"."events_cache_61" PARTITION OF "monitor"."events_cache" FOR VALUES IN (61); -- Ethereum Classic
CREATE TABLE "monitor_partitions"."events_cache_964" PARTITION OF "monitor"."events_cache" FOR VALUES IN (964); -- Bittensor EVM
CREATE TABLE "monitor_partitions"."events_cache_1890" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1890); -- Lightlink
CREATE TABLE "monitor_partitions"."events_cache_360" PARTITION OF "monitor"."events_cache" FOR VALUES IN (360); -- Shape
CREATE TABLE "monitor_partitions"."events_cache_46" PARTITION OF "monitor"."events_cache" FOR VALUES IN (46); -- Darwinia
CREATE TABLE "monitor_partitions"."events_cache_55244" PARTITION OF "monitor"."events_cache" FOR VALUES IN (55244); -- Superposition
CREATE TABLE "monitor_partitions"."events_cache_4061" PARTITION OF "monitor"."events_cache" FOR VALUES IN (4061); -- Nahmii
CREATE TABLE "monitor_partitions"."events_cache_9008" PARTITION OF "monitor"."events_cache" FOR VALUES IN (9008); -- Shido
CREATE TABLE "monitor_partitions"."events_cache_698" PARTITION OF "monitor"."events_cache" FOR VALUES IN (698); -- Matchain
CREATE TABLE "monitor_partitions"."events_cache_1380012617" PARTITION OF "monitor"."events_cache" FOR VALUES IN (1380012617); -- RARI Chain
CREATE TABLE "monitor_partitions"."events_cache_47763" PARTITION OF "monitor"."events_cache" FOR VALUES IN (47763); -- Neo X
CREATE TABLE "monitor_partitions"."events_cache_32520" PARTITION OF "monitor"."events_cache" FOR VALUES IN (32520); -- Bitgert
CREATE TABLE "monitor_partitions"."events_cache_690" PARTITION OF "monitor"."events_cache" FOR VALUES IN (690); -- Redstone
CREATE TABLE "monitor_partitions"."events_cache_12553" PARTITION OF "monitor"."events_cache" FOR VALUES IN (12553); -- RSS3 VSL
CREATE TABLE "monitor_partitions"."events_cache_2109" PARTITION OF "monitor"."events_cache" FOR VALUES IN (2109); -- Exosama
CREATE TABLE "monitor_partitions"."events_cache_800001" PARTITION OF "monitor"."events_cache" FOR VALUES IN (800001); -- OctaSpace
CREATE TABLE "monitor_partitions"."events_cache_202555" PARTITION OF "monitor"."events_cache" FOR VALUES IN (202555); -- Kasplex zkEVM
CREATE TABLE "monitor_partitions"."events_cache_11155111" PARTITION OF "monitor"."events_cache" FOR VALUES IN (11155111); -- Ethereum Sepolia
CREATE TABLE "monitor_partitions"."events_cache_97" PARTITION OF "monitor"."events_cache" FOR VALUES IN (97); -- BNB Chain Testnet
CREATE TABLE "monitor_partitions"."events_cache_80002" PARTITION OF "monitor"."events_cache" FOR VALUES IN (80002); -- Polygon Amoy
CREATE TABLE "monitor_partitions"."events_cache_11155420" PARTITION OF "monitor"."events_cache" FOR VALUES IN (11155420); -- Optimism Sepolia
CREATE TABLE "monitor_partitions"."events_cache_421614" PARTITION OF "monitor"."events_cache" FOR VALUES IN (421614); -- Arbitrum Sepolia
CREATE TABLE "monitor_partitions"."events_cache_84532" PARTITION OF "monitor"."events_cache" FOR VALUES IN (84532); -- Base Sepolia
CREATE TABLE "monitor_partitions"."events_cache_11124" PARTITION OF "monitor"."events_cache" FOR VALUES IN (11124); -- Abstract Testnet
CREATE TABLE "monitor_partitions"."events_cache_43113" PARTITION OF "monitor"."events_cache" FOR VALUES IN (43113); -- Avalanche Fuji
CREATE TABLE "monitor_partitions"."events_cache_338" PARTITION OF "monitor"."events_cache" FOR VALUES IN (338); -- Cronos Testnet
CREATE TABLE "monitor_partitions"."events_cache_11155931" PARTITION OF "monitor"."events_cache" FOR VALUES IN (11155931); -- RISE Testnet
CREATE TABLE "monitor_partitions"."events_cache_8408" PARTITION OF "monitor"."events_cache" FOR VALUES IN (8408); -- ZenChain Testnet
CREATE TABLE "monitor_partitions"."events_cache_824642" PARTITION OF "monitor"."events_cache" FOR VALUES IN (824642); -- ZugChain Testnet