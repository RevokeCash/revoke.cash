---
title: 'Monthly Update: January 2025'
description: Happy New Year, Revokers! We have made some significant improvements targeted at users who are using smart wallets. With the new support for batch revoking approvals using smart wallets, we've made it easier than ever to revoke multiple approvals at once.
date: 2025-01-31
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# Monthly Update: January 2025

Happy New Year, Revokers! In the first month of 2025, we have made some significant improvements targeted at users who are using smart wallets. With the new support for batch revoking approvals using smart wallets, we've made it easier than ever to revoke multiple approvals at once, and save on gas fees while doing so.

## Smart Wallet Support

In October of last year, we shipped support for *batch* revoking approvals. This was a feature that many users had been asking for, and we're glad to finally ship it. Due to technical limitations, these *batch* revokes still have to happen in multiple queued transactions. But when users are using smart wallets, such as [Ambire](https://ambire.com/), [Abstract Global Wallet](https://www.abs.xyz/) or [Safe](https://safe.global/), it is technically possible to batch all of these revokes into a single transaction.

While our initial implementation of batch revoking was not compatible with this functionality, we're happy to share that we've now shipped support for batch revoking approvals using smart wallets. So if you are using one of these smart wallets, you can now batch all of your revokes into a single transaction and save on gas fees.

## Improved Risk Indicators

We've also improved our risk engine that we've initially shipped in 2024. We've added additional risk indicators to detect potential scams and other malicious token approvals. We've also fixed some of the risk indicators that we'd added before so that they work more consistently and reliably.

## New Exploits

The year unfortunately started with a few new smart contract exploits that we've added to our [exploits section](/exploits). Luckily, these exploits were relatively small compared to some of the exploits that we've seen in the past years. If you've interacted with any of these exploited platforms in the past, we recommend you to check your approvals using our exploit checkers.

- [Orange Finance Hack](/exploits/orange)
- [Moby Trade Hack](/exploits/moby-trade)

## New Supported Networks

We've added a few more networks to our ever-growing list of 100+ supported networks.

- [Abstract](/token-approval-checker/abstract)
- [Ink](/token-approval-checker/ink)
- [Sonic](/token-approval-checker/sonic)
- [Soneium](/token-approval-checker/soneium)
- [Creator Chain Testnet](/token-approval-checker/creator-chain-testnet)
