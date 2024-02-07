---
title: 'Monthly Update: January 2024'
description: In January we mostly focused on getting more open source contributors. We added a lot of new "good first issue" tags to our GitHub repository and we're participating in the 30 Days of Web3 open source challenge.
date: 2024-01-31
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# Monthly Update: January 2024

In January we mostly focused on trying to attract more open source contributors to our repository, which is something we want to continue in the rest of 2024. We added a lot of new "good first issue" tags to our GitHub repository to make it easier for new contributors to find a good place to start and we're participating in the 30 Days of Web3 open source challenge. If you want to get involved, check out our [GitHub repo](https://github.com/RevokeCash/revoke.cash).

## 30 Days of Web3

In January we kicked off the [30 Days of Web3](https://onchainsquad.com/onchainsquad.com/hackathons/30-days-of-web3/) challenge. This is a challenge for open source projects to get more contributors and to help new contributors get started. We're participating in this challenge and we're looking forward to seeing what we can achieve.

We've already received a few pull requests from new contributors with some great new features and improvements. The first one we merged was adding a "search" functionality to the network select dropdown menus ([#180](https://github.com/RevokeCash/revoke.cash/pull/180)). This makes it easier to find the network you're looking for when you have a lot of networks to choose from. Another merged pull request was adding an indicator for old approvals ([#177](https://github.com/RevokeCash/revoke.cash/pull/177)). And there are still some [pull requests in progress](https://github.com/RevokeCash/revoke.cash/pulls?q=is%3Apr+is%3Aopen+sort%3Aupdated-desc).

The 30 Days of Web3 challenge extends into February so we hope to merge a few more pull requests in the coming month. And we hope to continue to attract new contributors to our repository in the rest of 2024, so we'll be working on supporting new developers on their first contributions. If you want to get involved, check out our [GitHub repo](https://github.com/RevokeCash/revoke.cash).

## Fixes and Improvements

Besides guiding our newest contributors, we also made some improvements to our website and our backend services. One of the more important updates that we did is that we moved a big part of our spender labels and token information to a new cloud hosting that allows for better caching and performance. This should make our website faster and more reliable.

## New Exploits

In January we saw one big exploit, the Socket Hack. This exploit affected any users that had active token approvals to the [Socket](https://socket.tech) cross-chain bridging protocol. This protocol was used under the hood by many cross-chain bridges, including Bungee and Rainbow Wallet. We created an exploit checker for this exploit so you can see if you're affected below.

- [Socket Hack](/exploits/socket)

## New Supported Networks

While we support 60+ different blockchain networks already, we're always looking to add more. And in January we added support for 5 new networks, bringing the total over 70.

New Mainnets:

- [ZKFair](/token-approval-checker/zkfair)
- [EOS EVM](/token-approval-checker/eos-evm)
- [Bitrock](/token-approval-checker/bitrock)
- [GoldX](/token-approval-checker/goldx)
- [Kroma](/token-approval-checker/kroma)

New Testnets:

- [Ethereum Holesky](/token-approval-checker/ethereum-holesky)
- [Optimism Sepolia](/token-approval-checker/optimism-sepolia)
- [Arbitrum Sepolia](/token-approval-checker/arbitrum-sepolia)
- [zkSync Sepolia](/token-approval-checker/zksync-sepolia)
- [Taiko Katla](/token-approval-checker/taiko-katla)
