# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Revoke.cash is a decentralized web application that allows users to inspect and revoke token approvals they've granted to smart contracts across 100+ blockchain networks. Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS.

## Development Commands

```bash
yarn dev                  # Start development server
yarn build               # Production build + sitemap generation
yarn lint                # Run Biome linting
yarn lint:fix            # Auto-fix linting issues
yarn test                # Run all tests (Mocha unit + Cypress E2E)
yarn test:mocha          # Unit tests only
yarn test:cypress        # E2E tests only
EXTENDED=true yarn test:mocha  # Extended chain validation tests
yarn analyze             # Build with bundle analysis
yarn translations:update # Upload/download translations via Localazy
```

## Code Style

- Make sure to write code that is easy to understand and maintain.
- Try to re-use existing utilities from the utils folders.
- We prefer simple and easy to read code, even if it comes at some performance cost.

## Key Architecture

### Logs Provider Pattern (`lib/providers.ts`)

Strategy pattern for fetching blockchain events:
- `BackendLogsProvider` - Uses backend API (chains with explorer API support)
- `ViemLogsProvider` - Direct RPC calls (fallback)
- `DivideAndConquerLogsProvider` - Wraps providers to split large block ranges

Provider selection is automatic based on chain support configuration.

### Event Fetching Pipeline

```
useEvents → getTokenEvents → EventGetter implementations → Parse → Allowances
```

Event getters in `lib/api/logs/`:
- `EtherscanEventGetter`, `CovalentEventGetter`, `BlockScoutEventGetter`
- `HyperSyncEventGetter` (Envio), `ProviderEventGetter` (direct RPC)

### Allowance Data Flow

1. `useLogs` fetches Approval/Transfer events from chain
2. `useAllowances` parses events into allowance structures
3. Token prices and spender risk data loaded separately (batched)
4. `AllowanceDashboard` renders the table with revoke controls

### State Management

- **TanStack React Query** - Server state (allowances, prices, spender data)
- **Zustand** - Transaction status tracking (`lib/stores/transaction-store.ts`)

### Caching Layers

- **IndexedDB (Dexie)** - Browser-side caching for blocks/events
- **Upstash Redis** - Serverless caching and rate limiting (optional)

## Key Files

- `lib/utils/chains.ts` - Chain configuration for 100+ networks (2400+ lines)
- `lib/utils/allowances.ts` - Allowance data structures and parsing
- `lib/providers.ts` - Logs provider strategy selection
- `lib/hooks/ethereum/useAllowances.tsx` - Main allowances hook
- `app/api/[chainId]/` - Backend API routes

## Chain Configuration

All chains defined in `lib/utils/chains.ts`. Support types:
- `PROVIDER` - Direct RPC with eth_getLogs
- `ETHERSCAN_COMPATIBLE` / `BLOCKSCOUT` / `ROUTESCAN` - Uses explorer API
- `COVALENT` - Uses Covalent API
- `HYPERSYNC` - Uses Envio HyperSync

## Adding a New Chain

1. Add to `CHAINS` in `lib/utils/chains.ts`
2. Add test address to `cypress/support/chain-fixtures.ts`
3. Add description to `locales/en/networks.json`
4. Run `yarn translations:update`

## Testing

- **Unit tests** (`test/`) - Mocha, validates chain configurations
- **E2E tests** (`cypress/e2e/`) - Cypress, tests user flows
- Test addresses per chain in `cypress/support/chain-fixtures.ts`

## Conventions

- Client components use `'use client'` directive
- 3-state loading pattern: `undefined` (loading), `null` (no data), `{...}` (has data)
- Events identified by `getEventKey()` combining type, address, blockNumber, logIndex
- Commit messages follow conventional commits (enforced by commitlint)

## Environment Variables

Essential:
- `NEXT_PUBLIC_INFURA_API_KEY`, `NEXT_PUBLIC_ALCHEMY_API_KEY` - RPC providers
- `COVALENT_API_KEY` - Covalent API access
- `ETHERSCAN_API_KEYS` - JSON object with explorer API keys
- `IRON_SESSION_PASSWORD` - 32-char session encryption key
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - Wallet connections

See `.env.example` for full list.

## Internationalization

5 languages (en, es, ja, ru, zh) using next-intl. Translations in `locales/`. Content in `content/`. Managed via Localazy.
