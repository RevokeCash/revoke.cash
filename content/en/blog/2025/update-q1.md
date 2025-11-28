---
title: 'Quarterly Update: Q1 2025'
description: We have made some significant improvements targeted at users who are using smart wallets. With the new support for batch revoking approvals using smart wallets, we've made it easier than ever to revoke multiple approvals at once.
date: 2025-03-31
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# Quarterly Update: Q1 2025

In the first quarter of 2025, we have made some significant improvements targeted at users who are using smart wallets. With the new support for batch revoking approvals using smart wallets, we've made it easier than ever to revoke multiple approvals at once, and save on gas fees while doing so.

We've also added features targeting Abstract Global Wallet users, helping them to revoke their session keys when needed, we've expanded our risk indicators, and made an exciting new integration with Fairside, the only crypto insurance provider to offer protection against phishing and social engineering drains.

## Smart Wallet Support

In October of last year, we shipped support for *batch* revoking approvals. This was a feature that many users had been asking for, and we're glad to finally ship it. Due to technical limitations, these *batch* revokes still have to happen in multiple queued transactions. But when users are using smart wallets, such as [Ambire](https://ambire.com/), [Abstract Global Wallet](https://www.abs.xyz/) or [Safe](https://safe.global/), it is technically possible to batch all of these revokes into a single transaction.

While our initial implementation of batch revoking was not compatible with this functionality, we're happy to share that we've now shipped support for batch revoking approvals using smart wallets. So if you are using one of these smart wallets, you can now batch all of your revokes into a single transaction and save on gas fees.

## Abstract Sessions Tab

Abstract launched their mainnet in January, and one of the big features to come alongside the network is the Abstract Global Wallet. This wallet boasts several account abstraction features, one of which is the concept of "Sessions". These sessions allow you to give other wallets permissions to sign transactions on your behalf. In that way they're similar to token approvals, but with a much broader scope.

::img{src="/assets/images/blog/2025/update-q1/abstract-sessions.jpg" alt="Abstract Sessions" width="1270" height="560"}

Shortly after the launch of Abstract's mainnet, these sessions were abused by a few malicious actors to steal funds from users. This showed the need for a way to revoke these sessions, and we've added a new tab to the website to do just that.

## Fairside Coverage Integration

Fairside is the only crypto coverage provider offering protection against phishing and social engineering drains, the most common way users lose funds today. For a small annual fee, Fairside covers wallets against losses from phishing, malware, and other forms of social engineering.

::img{src="/assets/images/blog/2025/update-q1/fairside-integration.jpg" alt="Fairside Coverage Integration" width="1200" height="600"}

We’ve been collaborating closely with Fairside on this integration, and we’re excited to finally bring it to you. The new **Coverage** tab now displays the coverage status for each of your wallets, along with a direct link to Fairside where you can purchase or manage your coverage.

## Improved Risk Indicators

We've also improved our risk engine that we've initially shipped in 2024. We've added additional risk indicators to detect potential scams and other malicious token approvals. We've also fixed some of the risk indicators that we'd added before so that they work more consistently and reliably.

## Fixes, Improvements & Refactoring

For security and performance reasons, it is important to stay up to date with the latest major versions of our big dependencies. This quarter we made the major upgrade to **Next.js v15**, which is the latest stable version of Next.js. With this we also upgraded our other dependencies to the latest versions, such as **Viem**, **Wagmi**, and **React**.

## New Exploits

The year unfortunately started with a few new smart contract exploits that we've added to our [exploits section](/exploits). Luckily, these exploits were relatively small compared to some of the exploits that we've seen in the past years. If you've interacted with any of these exploited platforms in the past, we recommend you to check your approvals using our exploit checkers.

- [Orange Finance Hack](/exploits/orange)
- [Moby Trade Hack](/exploits/moby-trade)

## New Supported Networks

We've added lots of networks to our ever-growing list of 100+ supported networks.

- [Abstract](/token-approval-checker/abstract)
- [Ink](/token-approval-checker/ink)
- [Sonic](/token-approval-checker/sonic)
- [Hyperliquid EVM](/token-approval-checker/hyperliquid-evm)
- [Unichain](/token-approval-checker/unichain)
- [Berachain](/token-approval-checker/berachain)
- [Story](/token-approval-checker/story)
- [Soneium](/token-approval-checker/soneium)
- [Gravity Alpha](/token-approval-checker/gravity-alpha)
- [Telos EVM](/token-approval-checker/telos-evm)
- [Flow EVM](/token-approval-checker/flow-evm)
- [Superposition](/token-approval-checker/superposition)
- [Ronin](/token-approval-checker/ronin)
- [Shido](/token-approval-checker/shido)
- [Neo X](/token-approval-checker/neo-x)
- [Ethernity](/token-approval-checker/ethernity)
- [Monad Testnet](/token-approval-checker/monad-testnet)
- [Creator Chain Testnet](/token-approval-checker/creator-chain-testnet)
