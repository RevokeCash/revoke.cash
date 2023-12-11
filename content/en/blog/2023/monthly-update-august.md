---
title: 'Monthly Update: August 2023'
description: In August we added support for Permit2 Approvals, a novel way of enabling gasless Permit signatures for all ERC20 tokens. We also extended our Learn Section with artciles that explain how gasless Permit signatures work, and where Permit2 fits in.
date: 2023-08-31
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# Monthly Update: August 2023

In August we added support for Permit2 Approvals, a novel way of enabling gasless Permit signatures for all ERC20 tokens, developed by Uniswap. We also extended our Learn Section with artciles that explain how gasless Permit signatures work, and where Permit2 fits in. And we've made some more overall fixes and improvements. Read on to learn more about what we've been up to in August.

## Support for Permit2 Approvals

Permit2 is a system that was developed by Uniswap in late 2022 to enable gasless Permit signatures for all ERC20 tokens, as well as add some other improvements to token approvals, such as expiring approvals. However, Permit2 also opens up some additional risk factors that increase your risk surface when interacting with scam websites. Where most approval-based scams can only steal one token at a time, all tokens that are approved via Permit2 can be stolen at once.

![Permit2 Approval Management](/assets/images/learn/approvals/what-is-permit2/permit2-approvals.png)

Because of this added risk, it is important that these Permit2 based approvals can properly be revoked, especially as these kinds of scams are on the rise. Our friends at [ScamSniffer](https://www.scamsniffer.io/) were quick to provide a tool to revoke these Permit2 approvals a few months ago, but we're happy to announce that we've now also added support for Permit2 approvals to Revoke.cash so you can manage them alongside your regular approvals.

## New Learn Articles

With our new support for Permit2 approvals, it is important to also provide education around both the benefits and risks of a system like Permit2. So this month we published two new Learn articles. The [first article](/learn/approvals/what-are-eip2612-permit-signatures) explains how _regular_ gasless Permit signatures work. And the [second article](/learn/approvals/what-is-permit2) builds on the knowledge from the first article to explain where Permit2 fits in, and what benefits and risks it brings.

## Fixes and Improvements

Besides these larger changes we're also always making smaller updates that improve the overall experience of using Revoke.cash and keep the website running. This month we've improved the FAQ page, fixed some issues with certain browser wallets and did some extra work to combat spam tokens. We've also put some focus on improving web performance scores and reduced image sizes to improve loading times.

## Gitcoin Grants 18

August was an important month for many projects building public goods in the Ethereum ecosystem. Gitcoin Grants has been in a transitional period this year and the previous round in May saw very high gas costs, which resulted in a lower than usual amount of donations for many projects. Revoke.cash still received a lot of support from the community, but we also got many reports from our users that they would have liked to donate if the transaction fees were lower.

![Revoke.cash on Gitcoin Grants 18](/assets/images/blog/2023/monthly-update-august/gitcoin-grants-18.jpg)

This round Gitcoin used Optimism to take donations on L2 and offer lower transaction fees. This resulted in a much higher amount of donations for many projects, including Revoke.cash. We ended Gitcoin Grants 18 with over $30,000 donated by over 15,000 people, making this by far our most successful Gitcoin Grants round yet. We're very grateful for all the support we are continuously seeing from our amazing community and are excited to make Revoke.cash even better for all of you.

<!-- November was an important month for many bootstrapped projects in the Ethereum ecosystem. Grant programs like Gitcoin Grants and Optimism RetroPGF help these projects to continue building and growing. And Revoke.cash is no exception. We've been busy promoting Revoke.cash on both platforms.

![Revoke.cash on Gitcoin Grants 19](/assets/images/blog/2023/monthly-update-november/gitcoin-grants-19.png)

We ended Gitcoin Grants 19 with close to $26,000 in donations from over 12,000 individual donors. And while Optimism's RetroPGF 3 is still ongoing, we've already passed the threshold to receive funding in this round. We're very grateful for all the support we've received from the community, and we're excited to continue building Revoke.cash. -->

## New Supported Networks

While we support over 40 different blockchain networks already, we're always looking to add more. And in August we added support for 3 new networks.

- [Mantle](/token-approval-checker/mantle)
- [Zora](/token-approval-checker/zora)
- [Horizen EON](/token-approval-checker/horizen-eon)
