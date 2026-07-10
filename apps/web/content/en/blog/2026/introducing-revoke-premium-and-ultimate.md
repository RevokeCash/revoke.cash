---
title: 'Introducing Revoke Premium & Ultimate'
description: Today we're launching Revoke Premium and Revoke Ultimate. Premium brings all your approvals together in one multichain dashboard, and Ultimate automatically revokes approvals on your behalf. Everything you use today stays free.
date: 2026-07-10T13:00:00Z
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# Introducing Revoke Premium & Ultimate

::video{src="/assets/videos/revoke-premium-announcement.mp4" title="Introducing Revoke Premium & Ultimate" width="1920" height="1080" controls preload="metadata"}

Today we're launching **Revoke Premium** and **Revoke Ultimate**, our biggest addition since Revoke.cash launched. Premium brings all your approvals together in one multichain dashboard, and Ultimate automatically revokes dangerous approvals on your behalf, even while you sleep. And just as important: everything you use today stays free.

## Why We're Launching Paid Plans

Revoke.cash has been free and open source since 2019. In that time we've helped millions of users stay safe and prevented over $140 million in losses from smart contract hacks alone. For most of that time, we relied on grants and donations from public goods funding initiatives like Optimism's Retro Funding, Gitcoin Grants and Octant to keep the platform running.

As we wrote last October in [Why We're Adding Batch Revoke Fees](/blog/2025/why-were-adding-batch-revoke-fees), public goods funding in crypto has declined significantly, and relying on it is no longer sustainable. The batch revoke fee was the first step towards a sustainable business model. Revoke Premium and Ultimate are the next step, and a much more exciting one: we get to offer genuinely new protection that was never possible before.

This model means the people who get the most value out of Revoke.cash directly fund its future. Every subscription pays for the infrastructure, monitoring and development that keep the free tools running for everyone else. That is the mission we started with: proper security tools should be accessible to everyone.

## Revoke Premium

Revoke Premium is built for people who are active on multiple chains. It costs **$99 per year** and covers up to 10 wallets.

### Multichain Dashboard

View and manage all your token approvals across 100+ networks from a single unified dashboard, including your full approval history. No more switching chains one by one to check where you're exposed.

### Multichain Exploit Checker

Check your wallets against all known exploits across every supported network at once. If any of your approvals are associated with compromised contracts, you can revoke them immediately.

### Unlimited Batch Revokes

Revoke multiple approvals in a single transaction at no extra cost, on every network. The $1.50 batch fee no longer applies to Premium subscribers.

### Time Machine

Travel back in time to see what your approvals looked like at any point in the past. The Time Machine lets you investigate how your approval state has changed over time across all supported networks.

## Revoke Ultimate

Revoke Ultimate includes everything in Premium, plus the feature we're most excited about: **Auto-Revoking**. It costs **$199 per year**, also covering up to 10 wallets.

Until now, Revoke.cash could only help you if you showed up. You had to hear about an exploit, open the site, find the approval and revoke it yourself. Auto-Revoking takes that job off your plate. It shrinks your exposure ahead of time by cleaning up stale and risky approvals, and once an exploit is identified, it responds right away instead of waiting for you to catch the news.

Here is how it works. You connect with MetaMask and grant Revoke.cash a permission that can only be used to revoke approvals. It cannot transfer funds, sign messages, or do anything else, and you can withdraw it at any time. Then you set your rules:

- **Risky Approval Detection**: automatically revoke approvals to exploited or risky contracts, with a sensitivity level you control.
- **Stale Approval Cleanup**: automatically revoke approvals older than a threshold you choose, 180 days by default.

From that moment, Revoke.cash monitors your approvals around the clock. When an approval matches your rules, we revoke it automatically on your behalf. When a new exploit is discovered, affected wallets are handled with priority, because minutes matter during an exploit. Gas fees are included: your subscription comes with a monthly gas allowance that comfortably covers normal usage.

Auto-Revoking currently works with MetaMask, the first wallet to support the ERC-7715 permission standard, on 10 popular networks. You can read more on the [How Auto-Revoking Works](/premium/automated-revoking) page, and if you want the full technical picture of delegations, executors and gas accounting, we published a [technical deep dive](/blog/2026/how-auto-revoking-works-under-the-hood) alongside this post.

One honest note: Auto-Revoking is best-effort protection. It meaningfully reduces your risk, but detection can lag and networks can get congested, so no system can guarantee that losses are prevented. We'd rather tell you that upfront than pretend otherwise.

## Pricing

- **Free**: essential tools to inspect and revoke token approvals. $0, forever.
- **Premium**: the full multichain experience. $99 per year, 10 wallets.
- **Ultimate**: set-and-forget protection with Auto-Revoking. $199 per year, 10 wallets.

Subscriptions are paid in USDC on Ethereum, Base, Arbitrum, Optimism, Polygon or BNB Chain. Head over to the [pricing page](/premium) for the full comparison, or go straight to your [account page](/account) to subscribe.

## What's Next

This launch is the foundation for a lot of what is coming next. More networks and wallets will be added to Auto-Revoking as ERC-7715 adoption grows, and having a sustainable business model means we can keep investing in the free tools that millions of people rely on.

Revoke.cash has been keeping users safe for almost seven years. With Premium and Ultimate, we can keep doing that for many more.

Thank you for your continued support.

Rosco
