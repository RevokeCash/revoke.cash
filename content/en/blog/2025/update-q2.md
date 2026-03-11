---
title: 'Quarterly Update: Q2 2025'
description: The second quarter of 2025 was a major milestone for Revoke.cash and the larger web3 ecosystem, with the long-awaited Pectra update landing on Ethereum mainnet. This update brought account abstraction to regular wallets, and Revoke.cash was the first application to support it.
date: 2025-04-30
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# Quarterly Update: Q2 2025

The second quarter of 2025 was a major milestone for Revoke.cash and the larger web3 ecosystem, with the long-awaited **Pectra** update landing on Ethereum mainnet. This update brought account abstraction and smart-wallet functionality to *regular* wallets for the first time, and Revoke.cash was the **first** application to support it.

We also launched the new **Delegations** tab, giving you visibility into your active delegations on **Delegate.xyz** and **Warm.xyz**. These delegations allow one address to act on behalf of another, for example when verifying asset ownership or claiming airdrops. We also added a new integration with Kerberus, launched gas sponsorships, and started gathering statistics on the impact that Revoke.cash has on the web3 space.

## Pectra Update

The highlight of Pectra is **EIP7702**, which upgrades regular EOAs with smart-wallet capabilities. This unlocks richer wallet features, and more powerful UX patterns across the ecosystem. And Revoke.cash was the **first** application to support EIP7702 on Ethereum mainnet from the moment the upgrade went live.

::img{src="/assets/images/blog/2025/update-q2/batch-revoke.jpg" alt="Batch Revoke" width="2160" height="1520"}

With this upgrade, our existing batch-revoke system takes a major leap forward: you can now finally **revoke multiple approvals in a single transaction**, drastically reducing the friction of cleaning up old or dangerous permissions. This is one of the biggest improvements to wallet UX in years, and we're excited to continue building on top of it.

## Delegations Tab

This quarter we launched the new **Delegations** tab, giving you visibility into your active delegations on **Delegate.xyz** and **Warm.xyz**. These delegations allow one address to act on behalf of another, for example when verifying asset ownership or claiming airdrops.

::img{src="/assets/images/blog/2025/update-q2/delegations-tab.jpg" alt="Delegations Tab" width="3456" height="1924"}

Delegations can meaningfully improve your security setup by letting you use a hot wallet for interactions while keeping your cold wallet offline. However, if the delegated (hot) wallet is ever compromised, revoking these permissions quickly is essential so that an attacker cannot impersonate you.

It's important to note that these delegations are **different** from **EIP7702 delegations**, which can *only* be revoked inside your wallet application.

## Kerberus Integration

We’ve partnered with **Kerberus**, a leading security company providing advanced tools for identifying malicious domains and preventing phishing attacks.

::img{src="/assets/images/blog/2025/update-q2/kerberus-integration.jpg" alt="Kerberus Integration" width="2044" height="1150"}

Our partnership with Kerberus has been a great success, and we've been able to ship two major improvements this quarter:

- A **dedicated Domain Scanner page**, powered by Kerberus, where you can quickly check if a website is safe to visit.
- **Automatic website scanning inside the Revoke browser extension** - whenever the extension appears, it now runs a Kerberus-powered safety check on the site you’re currently viewing.

## Gas Sponsorship

We partnered with **Candide** to offer **one gas-sponsored batch revoke per week** for every Revoke.cash user. This allows you to clean up your approvals for free once per week. For now, this initiative runs as a limited-time **Summer of Security** offer, but we may extend it based on interest and usage.

## Prevented Losses Statistics

As a public good, we are reliant on grants and donations to continue our work. We believe that this funding should primarily come from blockchains and foundations, but we've noticed that many of these organisations are not willing to fund public goods projects.

::img{src="/assets/images/blog/2025/update-q2/prevented-losses.png" alt="Prevented Losses Statistics" width="1920" height="1080"}

To help show the impact of our work, we've started gathering statistics on the impact that Revoke.cash has on the web3 space, backed by numbers from our on-chain monitoring. This is a work in progress, but so far it has been a great way to show the impact of our work, and we hope this will help us get more funding.

## Revoke.cash Team at ETH Bucharest

::img{src="/assets/images/blog/2025/update-q2/eth-bucharest.jpg" alt="Revoke.cash Team at ETH Bucharest" width="1920" height="1080"}

Our team attended **ETH Bucharest**, where we had the chance to connect with developers, researchers, and users from across the ecosystem. Events like this help us understand our users' needs to refine our roadmap for better protection tools. This is also a chance for us to help educate people about the risks of token approvals and how to stay safe.

## New Exploits

We continue to track and document exploit activity across the ecosystem. In June, one smaller but notable incident occurred involving deprecated contracts from **Bankroll Network**. The project had long been abandoned, but users with lingering token approvals remained vulnerable.

- [Bankroll Network Hack](/exploits/bankroll-network)

This reinforces a key lesson: even old, inactive approvals can pose risk, and regular cleanup remains one of the easiest ways to stay safe.

## New Supported Networks

We've added a few more networks to our ever-growing list of 100+ supported networks.

- [Lens](/token-approval-checker/lens)
- [Plume](/token-approval-checker/plume)
- [Zircuit](/token-approval-checker/zircuit)
- [Sophon](/token-approval-checker/sophon)
- [XDC](/token-approval-checker/xdc)
- [BasedAI](/token-approval-checker/basedai)
