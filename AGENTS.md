## General Coding Rules

NEVER stage changes, just leave them in the working directory.

## Repository Structure

- `apps/web/`: frontend app.
- `apps/indexer/`: approval-indexing service (events, allowances, token metadata).
- `packages/core/`: shared core logic.

### Quick Facts

- App type: Next.js 16 App Router dApp for inspecting/revoking approvals and related wallet permissions.
- Stack: React 19, TypeScript (strict), Tailwind v4, wagmi + viem, TanStack Query, Zustand.
- i18n: `next-intl`, locales `en`, `es`, `ja`, `ru`, `zh`.
- Chain coverage: very large multichain surface (110+ mainnets and 15 testnets in chain selector).
- Package manager: Yarn 4 (`nodeLinker: node-modules`, scripts locked down via `@lavamoat/allow-scripts`).

### Conventions and Gotchas

- Prefer writing code in a way that reads top-down, from the main entry point to the leaves.
- Always use descriptive variable names without abbreviations.
- Prefer readable, maintainable code over micro-optimizations.
- Reuse existing utilities before adding new helpers.
- Keep checksummed addresses (`getAddress`) rather than lowercase storage (except in database storage where lowercase addresses are used).
- Do not remove existing comments unless they are clearly outdated.
- Prefer one component per file unless multiple components are strongly justified.
- Prefer `const` assignment and not reassigning variables.
- Use descriptive variable names, no single letter variables unless they are very common and well-known (e.g. `i`, `j`, `k`).
- Prefer array methods over manual loops and avoid nested loops if possible.
