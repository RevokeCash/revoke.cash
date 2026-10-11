---
title: 'Quarterly Update: Q3 2026'
description: In the third quarter of 2026, we launched Revoke Premium and Ultimate. After the launch, we added Approved Transfer Detection, brought NFTs into your Value at Risk, expanded Auto-Revoking to more networks, and opened up the Cold Storage SBT to everyone.
date: 2026-09-30
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# Quarterly Update: Q3 2026

In the third quarter of 2026, we launched Revoke Premium and Ultimate. After the launch, we added Approved Transfer Detection, brought NFTs into your Value at Risk, expanded Auto-Revoking to more networks, and opened up the Cold Storage SBT to everyone.

## Revoke Premium & Ultimate Are Live

On July 16 we launched **Revoke Premium** and **Revoke Ultimate**, the biggest addition to Revoke.cash since it first launched in 2019. Everything you used for free before the launch is still free.

Revoke Premium gives you a multichain dashboard for up to 10 wallets. You can view and manage your token approvals, approval history and exploit exposure across all supported networks in one place, and batch revoke as often as you like without paying the batch revoke fee.

Revoke Ultimate includes everything in Premium and adds **Auto-Revoking**. You set your rules once, and Revoke.cash automatically revokes approvals to exploited or risky contracts and cleans up stale approvals on your behalf, around the clock.

Read the [full announcement](/blog/2026/introducing-revoke-premium-and-ultimate) for all the details, or the [technical deep dive](/blog/2026/how-auto-revoking-works-under-the-hood) if you want to know exactly how Auto-Revoking works.

## Auto-Revoking Improvements

We kept improving Auto-Revoking after the launch.

- Auto-Revoking now works on 14 networks, up from 10 at launch.
- Besides MetaMask, Auto-Revoking now also works with WalletChan.
- When many approvals need to be revoked at the same time, Auto-Revoking now handles the most important ones first, based on the value at risk and the risk of the spender.
- You can now filter the Auto-Revoking activity log, so it is easier to find a specific revoke.

You can find the full list of supported wallets and networks on the [How Auto-Revoking Works](/premium/automated-revoking) page.

## Approved Transfer Detection

Approvals let contracts move your tokens. With **Approved Transfer Detection**, Premium and Ultimate subscribers can see every transfer where a contract used one of their approvals to move their tokens, and exactly which contract did it.

::img{src="/assets/images/blog/2026/update-q3/approved-transfers.jpg" alt="Approved Transfer Detection" width="2400" height="1260"}

This is especially useful after a hack or a scam, when you want to know how your tokens left your wallet. Approved transfers show up in your approval history, and they work on most supported networks.

## NFTs in Your Value at Risk

Until now, the *Value at Risk* on the approvals dashboard only counted tokens. This quarter we added NFTs. The dashboard now shows how many NFTs you hold from each collection that you approved, and uses floor prices from CoinGecko to include them in your Value at Risk. This works on the 15 networks where CoinGecko has NFT data, and it is available to everyone for free.

## Cold Storage SBT Now Open to Everyone

When we launched the [Cold Storage SBT](/blog/2025/pudgy-penguins-revoke-cold-storage-sbt) with Pudgy Penguins last year, you needed to hold a Pudgy Penguin or Lil Pudgy to claim it. In September, we opened it up to everyone.

Your wallet is eligible if it has no active token approvals on Ethereum, and it has sent at least one transaction on Ethereum or holds an ETH balance. Head over to the [claim page](/cold-storage-sbt) to check your wallet, pass the quiz and mint your SBT.

## Improvements All Around

Besides the bigger features, we shipped a range of smaller updates and fixes across the site.

- Revoke.cash now switches your wallet to the correct network automatically when you revoke, so there is no separate "switch network" step anymore
- Made batch revokes more reliable by sending queued revokes one by one, and fixed batch revoke issues with MetaMask + Ledger, TokenPocket and several mobile wallets
- Improved spam token detection, so fewer fake tokens show up in your approvals
- Added support for Wei Name Service (.wei) and Gwei Name Service (.gwei) names in the search bar
- Added Glyph to the list of supported wallets
- Added an FAQ entry about non-standard NFT approvals, contributed by [kocaemre](https://github.com/kocaemre)
- Various smaller UI fixes and dependency upgrades

## New Exploits

Several new exploits occurred this quarter. We added each one to our [exploits section](/exploits), along with tools to check approvals related to the affected platforms.

- [BarnBridge Governance Attack](/exploits/barnbridge)
- [Lien Finance Hack](/exploits/lien-finance)
- [Magic Eden / Limit Break Hack](/exploits/magic-eden)

All three of these exploits targeted old approvals. BarnBridge shut down in 2023, Lien Finance had been abandoned for years, and Magic Eden stopped using Limit Break's Payment Processor in 2024. In each case, the approvals that users gave years ago were still active, and attackers used them to take funds.

The Magic Eden / Limit Break hack was the biggest one. Attackers abused a flaw in Payment Processor to take NFTs and drain approved tokens like WETH from anyone who still had approvals to it. The wallets that revoked these approvals before the attack kept their assets: more than 1,600 wallets, holding around $3.9M in NFTs and tokens, including 70 Bored Apes and 220 WETH.

::img{src="/assets/images/blog/2026/update-q3/magic-eden-hack.jpg" alt="Magic Eden Hack: $3.9M Saved by Revoking" width="2400" height="1350"}

We also reviewed and verified every exploit in our database, and added a few older exploits that were missing: [Liquid Crypto](/exploits/liquid-crypto), [Rico](/exploits/rico), [WINR](/exploits/winr) and an [earlier BasketDAO exploit](/exploits/basketdao-2021). Every exploit page now also has a longer explanation of what happened and what you should do.

If you interacted with any of these projects, we recommend reviewing your approvals.

## Network Changes

We added several new networks this quarter.

- [Arc](/token-approval-checker/arc)
- [Data Network](/token-approval-checker/data-network)
- [Doma](/token-approval-checker/doma)
- [Mythos](/token-approval-checker/mythos)
- [Animechain](/token-approval-checker/animechain)

We also removed support for 30 networks, along with several testnets. Some of these networks shut down or announced that they will shut down, some no longer had working infrastructure or reliable data sources, and others saw very little use on Revoke.cash. Supporting a network properly means indexing its full approval history and keeping its data sources running, and we would rather support fewer networks well than many networks poorly.

The removed networks are BitTorrent Chain, Bitgert, CoinEx Smart Chain, Cronos, Darwinia, Degen Chain, Dogechain, EDU Chain, Elastos, Exosama, Gravity Alpha, Harmony, HashKey Chain, Lisk, Moonbeam, Moonriver, Nahmii, Neo X, Neon EVM, OctaSpace, Oasis Emerald, Oasis Sapphire, RARI Chain, Shimmer EVM, Story, Superposition, Syscoin, Velas, ZERO and Zircuit.

Revoke.cash still supports more than 80 networks, and we will keep adding new networks when they have real activity and reliable data sources.
