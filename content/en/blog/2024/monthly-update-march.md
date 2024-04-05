---
title: 'Monthly Update: March 2024'
description: In March we partnered with ScamSniffer to provide alerts in the Revoke.cash Dashboard as a first step towards better insights into the risk of individual token approvals. We also implemented some important improvements and refactoring.
date: 2024-03-31
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# Monthly Update: March 2024

In March we made a first step towards better insights into the risk of individual token approvals. We partnered with ScamSniffer to provide alerts in the Revoke.cash Dashboard using their blocklist. We also did a lot of refactoring and similar maintenance work to improve the performance and stability of Revoke.cash.

## Revoke x ScamSniffer

With our security tools we are always trying to help our users stay safe. And to that end we have partnered with ScamSniffer to provide alerts in the Revoke.cash Dashboard using their blocklist. When one of your token approvals is on the ScamSniffer blocklist, you will see a warning in the Revoke.cash Dashboard. This will help identify potential scams and keep your funds safe.

![Revoke x ScamSniffer](/assets/images/blog/2024/monthly-update-march/scamsniffer.jpg)

This is a first step to providing better insights into the risk of individual token approvals. We are looking to expand this feature in the future to provide more information about the risks associated with each of your token approvals, so that you can make informed decisions about which approvals to revoke.

## Fixes, Improvements & Refactoring

This month we did a lot of refactoring and similar maintenance work. Most of this work was aimed at improving the performance and stability of Revoke.cash, such as updating to the latest versions of Viem and Wagmi, adding additional Multicall3 deployments, and improving our spam token filters. We also made changes to our Chain Support system to make it easier to add new networks in the future.

## New Exploits

In March we saw two big black hat exploits and one significant white hat rescue operation. DeFi platform Dolomite saw one of their deprecated old contracts from 2019 exploited. Even though this contract had been out of the running for years, users still had active approvals to the contract and lost close to $2M. Over $2M was also lost by users of decentralised exchange Unizen. Finally DEX ParaSwap discovered a vulnerability in their own contracts and were able to rescue most vulnerable funds on behalf of their users.

- [Unizen Hack](/exploits/unizen)
- [ParaSwap Whitehat Hack](/exploits/paraswap)
- [Dolomite Hack](/exploits/dolomite)

## New Supported Networks

While we support 80+ different blockchain networks already, we're always looking to add more. And in January we added support for 7 new networks and 2 new testnets.

New Mainnets:

- [Degen Chain](/token-approval-checker/degen-chain)
- [Merlin](/token-approval-checker/merlin)
- [Fraxtal](/token-approval-checker/fraxtal)
- [Beam](/token-approval-checker/beam)
- [inEVM](/token-approval-checker/inevm)
- [Immutable zkEVM](/token-approval-checker/immutable-zkevm)
- [zkLink Nova](/token-approval-checker/zklink-nova)

New Testnets:

- [Beam Testnet](/token-approval-checker/beam-testnet)
- [Redstone Holesky](/token-approval-checker/redstone-holesky)
