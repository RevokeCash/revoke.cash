---
title: 'Monthly Update: February 2024'
description: In February we made some much-needed improvements to the Signatures Dashboard. We got help with this from outside contributors through the 30 Days of Web3 challenge, which continued from January.
date: 2024-02-29
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# Monthly Update: February 2024

In February we made some much-needed improvements to the Signatures Dashboard. The signatures dashboard had been a source of confusion for many users, so it was time to improve our interface to make it easier to understand and clear up some of the confusion. We got help with this from outside contributors through the 30 Days of Web3 challenge, which continued from January. We hope to continue to attract new contributors to our repository in the rest of 2024.

## Signatures Dashboard Improvements

It's been close to a year since we launched the Signatures Dashboard, and over the past year it has often been the cause of confusion for users. We've attempted to help educate users by publishing articles about Permit signatures and by adding more information to the dashboard itself. But we've come to the conclusion that we should do a better job of showing rather than telling.

The difficulty with the Signatures Dashboard is that it's a complex topic and it's hard to explain in a way that's easy to understand. With the biggest issue being that signatures are offchain, which means that we can never show a completely accurate picture of which signatures need to be cancelled.

![Signatures Dashboard Improvements](/assets/images/blog/2024/monthly-update-february/signatures-dashboard.png)

Unfortunately we cannot solve the issue of communicating which signatures need to be cancelled, but we can hopefully show more insight in which don't need to be cancelled (again). Due to the offchain nature of signatures, we can never be 100% sure whether someone has signed a signature since their last cancellation, but we can show the last time a signature was cancelled. This is what we've added to the Signatures Dashboard in February.

Additionally, we also want to make sure that users do not accidentally cancel the same signature multiple times. We've noticed that this happens quite often as people are not sure whether their cancellation went through, since the potential still remain in the list. Again, these potential signatures _have_ to remain in the list due to the offchain nature of these signatures. And we think that this is fine as long as users know that their cancellation went through.

With the "Last Cancellation" column added we hope to show users that their cancellation went through and that they don't need to cancel the same signature again. On top of that we also block cancellations for signatures that have been cancelled in the past 24 hours. This should help prevent users from accidentally cancelling the same signature multiple times.

## 30 Days of Web3

In January we kicked off the [30 Days of Web3](https://onchainsquad.com/onchainsquad.com/hackathons/30-days-of-web3/) challenge. And in February it continued and concluded. This is a challenge for open source projects to get more contributors and to help new contributors get started. We're very happy with the contributions we received and we're looking forward to see if we can continue to attract new contributors to our repository in the rest of 2024.

As a part of the 30 Days of Web3 challenge, we've seen a lot of new contributions small and large - both in January and February. It was definitely nice to see so many people contribute and it was also a challenge for us to properly guide these new contributors. In certain cases we noticed that the issues we had tagged as "good first issue" were not always as easy as we thought they were. So plenty of times we had to chip in and help out with the more difficult issues.

This is the full list of pull requests that created by outside contributors in January and February as part of the 30 Days of Web3 challenge:

- Add search functionality to network select dropdowns ([#180](https://github.com/RevokeCash/revoke.cash/pull/180))
- Add indicator for old approvals ([#177](https://github.com/RevokeCash/revoke.cash/pull/177))
- Add "Last Cancelled" column to Signatures Dashboard ([#187](https://github.com/RevokeCash/revoke.cash/pull/187))
- Filter marketplace signatures based on active approvals ([#176](https://github.com/RevokeCash/revoke.cash/pull/176))
- Retain focus on network select dropdowns ([#192](https://github.com/RevokeCash/revoke.cash/pull/192))
- Make sure "Last Updated" data gets updated after editing an approval ([#194](https://github.com/RevokeCash/revoke.cash/pull/194))
- Add Darwinia and Crab networks ([#195](https://github.com/RevokeCash/revoke.cash/pull/195))
- Typo fixes ([#191](https://github.com/RevokeCash/revoke.cash/pull/191))

## New Exploits

In January we saw one big exploit, the Seneca Hack - where over $6m in user funds were stolen. This exploit affected any users that had active token approvals to DeFi protocol [Seneca](https://senecaprotocol.com/). We created an exploit checker for this exploit so you can see if you're affected below.

- [Seneca Hack](/exploits/seneca)

## New Supported Networks

While we support 70+ different blockchain networks already, we're always looking to add more. And in January we added support for 6 new networks, bringing the total to over 80 supported networks.

New Mainnets:

- [Blast](/token-approval-checker/blast)
- [ZetaChain](/token-approval-checker/zetachain)
- [Mode](/token-approval-checker/mode)
- [RARI Chain](/token-approval-checker/rari-chain)
- [Darwinia](/token-approval-checker/darwinia)
- [Crab](/token-approval-checker/crab)

New Testnets:

- [Blast Sepolia](/token-approval-checker/blast-sepolia)
- [Berachain Artio](/token-approval-checker/berachain-artio)
