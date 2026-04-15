# AI Agents Context

This file provides guidance to Claude Code and other agents when working with code in this repository.

## Quick Facts

- App type: Next.js 16 App Router dApp for inspecting/revoking approvals and related wallet permissions.
- Stack: React 19, TypeScript (strict), Tailwind v4, wagmi + viem, TanStack Query, Zustand.
- i18n: `next-intl`, locales `en`, `es`, `ja`, `ru`, `zh`.
- Chain coverage: very large multichain surface (110+ mainnets and 15 testnets in chain selector).
- Package manager: Yarn 4 (`nodeLinker: node-modules`, scripts locked down via `@lavamoat/allow-scripts`).

## Development Commands

```bash
yarn dev                         # Next dev server (webpack)
yarn build                       # Production build + next-sitemap
yarn build:preview               # Profiled preview build + sitemap
yarn build:images                # Generate OG images and move generated files to public/assets/images/generated
yarn analyze                     # Bundle analysis build

yarn lint                        # Biome check
yarn lint:fix                    # Biome write fixes
yarn lint:staged                 # Lint staged files (used by pre-commit)
yarn tsc --noEmit                # TypeScript check (also in pre-commit + CI)

yarn test:mocha                  # Chain config and logs validation tests
EXTENDED=false yarn test:mocha   # Skip extended online chain checks
yarn test:cypress                # Cypress E2E
yarn test                        # Mocha + Cypress

yarn translations:update         # Localazy upload/download + lint fix
yarn translations:update:md      # Markdown translation sync + cleanup
yarn tsx <script.ts>             # Run scripts through dotenvx
```

Notes:
- `yarn test:cypress` assumes the app is already running; tests default to `http://localhost:3000` unless `TEST_URL` is provided in Cypress expose config.
- `test/chains.test.ts` runs extended checks by default unless `EXTENDED=false`.

## Repository Structure

- `app/`
- `app/[locale]/...`: all localized UI routes (landing, address pages, learn/blog/docs-like pages, tools, exploits, etc.).
- `app/api/...`: backend routes used by frontend (logs, block, spender data, prices, batch revoke recording, login/session, SIWE, pudgy claim).
- `components/`: UI grouped by feature (`allowances`, `history`, `delegations`, `sessions`, `signatures`, `coverage`, `exploits`, etc.).
- `lib/`
- `lib/utils/`: chain config, allowance/event parsing, revoke logic, permit helpers, whois/name logic, formatting/errors.
- `lib/hooks/`: React data and wallet hooks.
- `lib/api/logs/`: event getter implementations (Etherscan-like, Blockscout, Routescan, Covalent, HyperSync, custom, node).
- `lib/databases/`: browser caching (Dexie-backed events/blocks caches).
- `lib/price/`: token/NFT price strategy abstractions.
- `lib/delegations/`: delegate.xyz/warm delegation platform abstraction + revoke prep.
- `content/<locale>/`: markdown content for blog/learn/exploits/docs/pages.
- `locales/<locale>/`: translation JSON namespaces.
- `scripts/`: maintenance/generation scripts.
- `test/`: Mocha tests (primarily chain support validation).
- `cypress/`: E2E tests and chain fixture addresses.

## Runtime Architecture

### App Bootstrapping

- Main provider stack is wired in `app/[locale]/layout.tsx`.
- Provider order: `NextIntlClientProvider` -> `QueryProvider` -> `EthereumProvider` -> `ColorThemeProvider`.
- Global shell components (header/footer/toasts/top loader/analytics) are mounted here.
- Locale routing middleware lives in `proxy.ts` (next-intl matcher config), not `middleware.ts`.

### Address Page Data Flow

- Address pages use `AddressPageContextProvider` in `app/[locale]/address/[addressOrName]/layout.tsx`.
- Selected chain comes from `chainId` query param, connected wallet chain, or fallback to Ethereum mainnet.
- Core flow:
  `getTokenEvents` -> parsed token events -> `getAllowancesFromEvents` -> enrich with token price + spender risk data -> table/dashboard.

### Event/Logs Fetching Model

- Primary entry: `lib/chains/events.ts`.
- Event source selection is driven by chain support type from `lib/utils/chains.ts` and `lib/api/globals.ts`.
- Frontend `getLogsProvider` (`lib/providers.ts`) chooses:
  - Backend API (`/api/[chainId]/logs`) for non-`PROVIDER` chain types.
  - Direct viem RPC for `PROVIDER`.
  - `DivideAndConquerLogsProvider` wraps requests and retries split ranges on response-size failures.
- Backend logs API uses `EventGetter` implementations in `lib/api/logs/`.

### Caching and Queues

- Browser-side caches:
  - `lib/databases/events.ts` (logs cache, incremental by `toBlock`).
  - `lib/databases/blocks.ts` (block timestamp cache).
- Optional server queue/rate limiter: `lib/api/logs/RequestQueue.ts`.
  - Uses Upstash (`UPSTASH_REDIS_REST_*`) when configured.
  - Falls back to in-memory `p-queue`.
- Important: `eventsDB.getLogs()` assumes full-history queries (`fromBlock=0` to latest) and maintains incremental cache accordingly.

### Transaction Handling

- Single revoke/update flow: `lib/hooks/ethereum/useRevoke.tsx` + `lib/utils/allowances.ts`.
- Batch revoke flow: `lib/hooks/ethereum/useRevokeBatch.tsx`.
  - Prefers EIP-5792 batching when wallet supports it.
  - Falls back to queued per-transaction flow.
  - Optional fee payment and optional Candide paymaster sponsorship support.
- Transaction status state lives in `lib/stores/transaction-store.ts` (Zustand).

### Additional Feature Modules

- Approval history: `lib/hooks/ethereum/useApprovalHistory.tsx`, `lib/utils/approval-history.ts`.
- Permit signatures and marketplace bulk delisting: `lib/hooks/ethereum/usePermitTokens.tsx`, `lib/hooks/ethereum/useMarketplaces.tsx`.
- Delegations and EIP-7702: `lib/hooks/ethereum/delegations/*`, `lib/utils/eip7702.ts`, `lib/delegations/*`.
- Sessions (Abstract): `lib/hooks/ethereum/sessions/*`, `lib/utils/sessions.ts`.
- Coverage integration (Fairside): `lib/coverage/fairside.ts`.
- Exploits: `lib/utils/exploits.ts` (pulls exploit list data from `RevokeCash/approval-exploit-list`).

## API and Security Model

- `/api/auth/login` sets an iron-session cookie tied to requester IP.
- Most chain API routes require:
  - active session check (`checkActiveSessionEdge`),
  - rate-limit check (`RateLimiters` in `lib/api/auth.ts`).
- Most API routes run on Edge runtime; logs/block routes default to Node runtime.
- Rate limiters in `lib/api/auth.ts` use in-memory `RateLimiterMemory` (per instance, non-distributed).

## Chain Configuration

- Chain definitions and routing logic live in `lib/utils/chains.ts` (source of truth).
- Support types are defined in `lib/chains/Chain.ts` (`PROVIDER`, `HYPERSYNC`, `ETHERSCAN`, `BLOCKSCOUT`, `ROUTESCAN`, `COVALENT`, `BACKEND_NODE`, `BACKEND_CUSTOM`, `UNSUPPORTED`).
- `CHAIN_SELECT_MAINNETS` / `CHAIN_SELECT_TESTNETS` drive UI chain dropdown order.
- `ORDERED_CHAINS` is used across UI, wagmi config, tests, and fixtures.

### Adding a New Chain Checklist

1. Add/update chain config in `CHAINS` in `lib/utils/chains.ts`.
2. Add chain ID to `CHAIN_SELECT_MAINNETS` or `CHAIN_SELECT_TESTNETS`.
3. Add Cypress fixture wallet in `cypress/support/chain-fixtures.ts`.
4. Add/update network description in `locales/en/networks.json`.
5. Optionally run `yarn tsx scripts/get-chain-order.ts` to inspect relative ordering suggestions.
6. Run `yarn test:mocha` (and ideally Cypress checks) before merge.

## Testing and CI

- Mocha tests: `test/chains.test.ts`.
  - Verifies chain config integrity, fixture coverage, network descriptions, and (extended mode) live log retrieval.
- Cypress tests: `cypress/e2e/*.cy.ts`.
  - Includes broad chain smoke checks, whois/name resolution, exploit checker, and allowances rendering checks.
- Git hooks:
  - pre-commit: `yarn lint-staged` + `yarn tsc --noEmit`.
  - commit-msg: conventional commitlint.
- GitHub Actions currently run lint and TS checks (`.github/workflows/biome.yml`, `.github/workflows/typescript_check.yml`).

## Environment Variables

Primary core:
- `IRON_SESSION_PASSWORD` (required for API session cookie sealing).
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`.
- RPC/API keys used by configured chains (`ALCHEMY`, `INFURA`, `DRPC`, Etherscan-family, etc.).

Chain/log providers:
- `ETHERSCAN_API_KEYS`, `ETHERSCAN_RATE_LIMITS`.
- `COVALENT_API_KEY`, `COVALENT_RATE_LIMIT`.
- `HYPERSYNC_API_KEY`.
- `NODE_URLS` (backend node getter map).
- `NEXT_PUBLIC_NODE_URLS` (frontend RPC override map).

Pricing/risk/integrations:
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
- `WEBACY_API_KEY` or `NEXT_PUBLIC_WEBACY_API_KEY`.
- `RESERVOIR_API_KEY` / `NEXT_PUBLIC_RESERVOIR_API_KEY`.
- `COINGECKO_API_KEY` / `NEXT_PUBLIC_COINGECKO_API_KEY`.
- `NEXT_PUBLIC_FAIRSIDE_API_KEY`.
- `PUDGY_API_KEY`, `PUDGY_API_URL`.

Batch revoke sponsorship:
- `NEXT_PUBLIC_CANDIDE_API_KEY`.
- `NEXT_PUBLIC_CANDIDE_SPONSORSHIP_POLICIES` (JSON map by chain ID).

Analytics and content tooling:
- `NEXT_PUBLIC_MIXPANEL_API_KEY`.
- `DATABASE_URL` (batch revoke recording).
- `LOCALAZY_API_KEY` (translation edit links).

Notes:
- `lib/constants.ts` resolves several keys from private first, then `NEXT_PUBLIC_*`.
- Keep `.env` local only; it is gitignored.

## Conventions and Gotchas

- Always use descriptive variable names without abbreviations.
- Prefer readable, maintainable code over micro-optimizations.
- Reuse existing utilities before adding new helpers.
- Keep checksummed addresses (`getAddress`) rather than lowercase storage.
- Do not remove existing comments unless they are clearly outdated.
- Prefer one component per file unless multiple components are strongly justified.
- Many App Router pages are static (`dynamic='error'`, `dynamicParams=false`); update static params when adding new dynamic content paths.
