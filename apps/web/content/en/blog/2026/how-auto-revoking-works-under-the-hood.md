---
title: 'How Auto-Revoking Works Under the Hood'
description: Revoke Ultimate can revoke approvals on your behalf without ever holding your keys or your funds. This technical deep dive covers the ERC-7715 permissions and the full technical architecture that makes it possible.
date: 2026-07-10
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# How Auto-Revoking Works Under the Hood

Today we launched [Revoke Premium & Ultimate](/blog/2026/introducing-revoke-premium-and-ultimate). The flagship feature of Ultimate is Auto-Revoking: Revoke.cash monitors your approvals around the clock and automatically revokes dangerous ones on your behalf. The launch post covers what it does. This post covers how it works, for the technically curious.

The core question is simple to state and hard to answer: how do you revoke an approval on someone's behalf without holding their keys? Revoking requires a transaction from the token owner's address, and we cannot custody user keys. So we needed a mechanism with strict properties:

- It can only ever revoke approvals. Not transfer funds, not sign messages, nothing else.
- The user can withdraw it at any time, on-chain, without our cooperation.
- Even a full compromise of our infrastructure must not put user funds at risk.
- It has to be fast, because during an exploit, minutes matter.

The answer is built on two young Ethereum standards: ERC-7710 and ERC-7715.

## ERC-7710 and ERC-7715 in a Nutshell

**ERC-7710** describes smart contract delegations: signed messages that allow a delegate to act on your behalf, subject to caveats. Caveats are rules enforced on-chain: which contracts may be called, which functions, with which arguments, until when. To use a delegation, the delegate calls `redeemDelegations` on a `DelegationManager` contract, which verifies the signature chain and every caveat before executing anything, and reverts if any rule is violated.

**ERC-7715** is the wallet-facing counterpart. It defines `wallet_requestExecutionPermissions`, a JSON-RPC method that lets an app request a scoped permission. The wallet shows the user exactly what is being asked, and returns a signed delegation if they approve. MetaMask is the first wallet to ship support for it, which is why Auto-Revoking currently requires MetaMask.

## The Permission You Grant

When you enable Auto-Revoking for a network, Revoke.cash requests an ERC-7715 permission of the type `token-approval-revocation`. The name is the whole story: caveat enforcers guarantee the permission can only be used to revoke ERC-20, NFT and Permit2 approvals. It cannot grant a new approval, move a token, or touch any other contract, and a timestamp caveat bounds it to 10 years.

You can withdraw the permission at any moment: from the Revoke.cash UI, from inside MetaMask, or by calling `disableDelegation` on the DelegationManager yourself. The executor checks the on-chain disabled status before every execution, so a withdrawn permission is dead even if our database says otherwise.

## One Cold Account, Two Hot Wallets

The permission you grant does not go to the server that sends transactions. It goes to a **cold smart account**: `0xD08e8BB3D754641BBF6dd2E797b1B52703f00486`. That is the address you see in the MetaMask prompt, and thanks to CREATE2 it is the same address on every supported network. Its signer is a hardware wallet kept in cold storage that never touches any server.

The servers that send transactions use two **hot wallets**, one per execution lane. In an offline signing ceremony, the cold account signs a delegation to each hot wallet, with a caveat that restricts it to exactly one function on exactly one contract: `redeemDelegations` on the DelegationManager. A hot wallet can redeem user permissions and do literally nothing else.

At execution time, the two hops chain together in a single transaction, with the DelegationManager verifying both signature chains and every caveat on-chain:

```text
hot wallet EOA
  └─ DelegationManager.redeemDelegations(cold → hot)
       └─ DelegationManager.redeemDelegations(user → cold)
            └─ token.approve(spender, 0)
```

This split is what makes the security model work. The 10-year permissions users grant are anchored to the cold account, whose key is kept offline. The hot keys on servers are disposable: rotating one means a new signing ceremony, without users needing to re-grant anything.

## Detecting Dangerous Approvals

Auto-Revoking is driven by the same indexing infrastructure that powers the Premium multichain dashboard. It maintains an up-to-date view of every wallet's live allowances, and every time a protected wallet's allowances change, the wallet is re-evaluated against its rules. An allowance can match three trigger types:

- **Exploit**: the spender appears in a known exploit.
- **Risk score**: the spender is flagged as risky, at or above your configured sensitivity.
- **Stale**: the approval is older than your configured threshold, 180 days by default.

The exploit path is the time-critical one. Our [exploit list](https://github.com/RevokeCash/approval-exploit-list) is public on GitHub, and the moment a new exploit is added, a webhook fires into the indexer and every wallet with a live allowance to the exploited spenders is immediately re-evaluated with fresh on-chain data. Matches become queued revoke actions, with exploit-triggered actions jumping to the front while others get a short cooling-off delay.

## The Two-Lane Executor

Sending the transactions is the job of a dedicated executor service, the only component that holds the hot keys. It is a queue consumer that takes each action through an eligibility check, a cost check, signing and broadcasting. The interesting part is that there are two of everything: an **urgent** lane for exploit-triggered revokes and a **normal** lane for everything else, each with its own hot wallet.

Separate wallets mean nonce isolation: each lane is a per-chain pipeline of consecutive nonces, and if a transaction gets stuck at the head of a pipeline, everything behind it waits. With two wallets, a clogged normal lane can never delay an exploit response. The executor keeps its pipelines moving by confirming receipts, rebroadcasting missing transactions, and fee-bumping stuck ones, with the urgent lane bidding higher priority fees throughout.

## Gas Accounting

Revoke.cash pays the gas for every auto-revoke, so Ultimate includes a monthly gas allowance of $5 per subscription. Costs are estimated before submission and settled after mining. But "we pay the gas" needs guardrails. The rules, in order:

- **Per-action cap of $2.** No single revoke may cost more. Over the cap, the action is retried later.
- **Soft cap of $0.20 with 24 hours of patience.** A normal-lane action above $0.20 waits for cheaper gas, but goes through anyway after 24 hours. Urgent actions skip this.
- **The monthly budget.** Normal actions stop when the $5 is committed, except dust-cheap revokes.
- **Urgent actions bypass the monthly budget.** If an exploit hits when your budget is spent, we revoke anyway.
- **A hard ceiling of 2x the monthly budget.** Everything above, including the urgent bypass and the dust lane, is bounded by an absolute $10 ceiling per subscription per month.

## What If Things Go Wrong?

The design goal was that no failure on our side can endanger user funds.

**A hot wallet key leaks.** The attacker gains the ability to... revoke approvals for our users, using our gas. The caveats leave nothing else to do with it.

**We still want to shut it down.** With a killswitch, the cold key can disable all delegations to our hot wallets on-chain, making a leaked hot key useless. User permissions are untouched, so protection resumes once new hot wallets are set up.

**You change your mind.** Disable the permission in the UI (or directly on the DelegationManager) and it is dead on-chain, checked before every execution.

**Your subscription lapses.** Monitoring stops and pending actions are parked. Your rules and permissions are preserved, so everything picks up where it left off when you resubscribe.

One honest limitation: Auto-Revoking is best-effort. An exploit has to be identified before it can trigger a revoke, an attacker may act before we do, and chains can be congested at the worst possible moment. It meaningfully shortens your window of exposure, from "whenever you happen to check Twitter" to "minutes after an exploit is identified", but nobody can guarantee that losses are prevented, and you should be skeptical of anyone who claims otherwise.

## Try It

Auto-Revoking is live today on Ethereum, Base, BNB Chain, Arbitrum, Optimism, Polygon, Gnosis, Linea, Monad, and Unichain, with MetaMask. More networks and wallets will follow as ERC-7715 adoption grows.

Like the rest of Revoke.cash, all of this code is open source in our [monorepo on GitHub](https://github.com/RevokeCash/revoke.cash). For the user-facing overview, see [How Auto-Revoking Works](/premium/automated-revoking), and if you are ready for set-and-forget protection, head to the [pricing page](/premium).
