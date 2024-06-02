---
title: 'Monthly Update: April 2024'
description: April was a month of cleaning up and refactoring. While we already did significant refactors in March, we still had a lot more to do in April. We also made the difficult decision to remove some functionality to make room for new upcoming features.
date: 2024-04-30
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# Monthly Update: April 2024

April was a month of cleaning up and refactoring. While we already did significant refactors in March, we still had a lot more to do in April. We also made the difficult decision to remove some functionality to make room for new upcoming features.

## Removed Wallet Health Score

We added the Wallet Health Score in collaboration with Nefture last September, but this month we made the decision to remove it. The main reason for this decision is that we believe that in its current iteration, the Wallet Health score raises more questions than it answers with our user.

We do believe that providing these kinds of insights is very important, however. That is why we're working on a replacement that will provide more actionable insights for individual token approvals. We believe that iterating and experimenting with these kinds of features is important to find the right solution, so we do not regret trying out the Wallet Health Score, and we hope we can offer something new soon.

## Removed Sponsors Section

We also removed the Sponsors section from our website. We launched our sponsorships program a bit over a year ago, and we are very grateful to all the sponsors that have supported us. However, there was not enough interest from new sponsors to keep the program running, so we decided to remove it and focus on other ways to fund our project.

These are all the companies that sponsored us in the past year during our sponsorships program: [Boring Security](https://boringsecurity.com/), [PREMINT](https://www.premint.xyz/), [Vulcan](https://www.vulcan.xyz/), [Earni.fi](https://earni.fi/), [Brave Wallet](https://brave.com/wallet/), [Swap.kiwi](https://swap.kiwi/), [Mintify](https://mintify.xyz/) and [Layer3](https://layer3.xyz/).

## Fixes, Improvements & Refactoring

We did some big refactoring in March, but unfortunately the work wasn't done yet. There was still a lot of _very_ significant refactoring work remaining, because we had been holding off on upgrading Next.js since they came out with their new App Router last year. But in April we finally decided to take the plunge. Any developer that has worked with Next.js knows that this upgrade is a big deal, and especially our internationalisation system was hard to get working with the new App Router.

## New Exploits

In April, we saw two approval-based exploits, both of which were fortunately not as big as some of the exploits we've seen in the past. Perp DEX Merkle got exploited with $20k of user funds lost, while crosschain DEX Magpie got exploited for $130k.

- [Merkle Hack](/exploits/merkle)
- [Magpie Hack](/exploits/magpie)

## New Supported Networks

While we support 90+ different blockchain networks already, we're always looking to add more. In April we added support for 1 new network, RSS3 VSL.

New Mainnets:

- [RSS3 VSL](/token-approval-checker/rss3-vsl)

New Testnets:

- [RSS3 VSL Testnet](/token-approval-checker/rss3-vsl-testnet)
