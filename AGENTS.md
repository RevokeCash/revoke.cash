## General Coding Rules

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

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

- Always use descriptive variable names without abbreviations.
- Prefer readable, maintainable code over micro-optimizations.
- Reuse existing utilities before adding new helpers.
- Keep checksummed addresses (`getAddress`) rather than lowercase storage (except in database storage where lowercase addresses are used).
- Do not remove existing comments unless they are clearly outdated.
- Prefer one component per file unless multiple components are strongly justified.
- Prefer writing code in a way that reads top-down, from the main entry point to the leaves.
- Prefer `const` assignment and not reassigning variables.
- Use descriptive variable names, no single letter variables unless they are very common and well-known (e.g. `i`, `j`, `k`).
- Prefer array methods over manual loops and avoid nested loops if possible.
