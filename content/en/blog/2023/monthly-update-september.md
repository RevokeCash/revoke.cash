---
title: 'Monthly Update: September 2023'
description: In September we released some pretty big features. The most important is the addition of pricing information, giving users insight into the actual value at risk of their approvals. We also updated our code base to use Wagmi v1 and Viem.
date: 2023-09-30
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# Monthly Update: September 2023

In September we released some pretty big features. The most important is the addition of pricing information, giving users insight into the actual value at risk of their approvals. We also migrated our code base to Wagmi v1 and Viem, which will make it easier to add new features and should also come with some performance improvements. Read on to learn more about what we've been up to in September.

## Pricing Information & Wallet Health

The biggest new release this month is the addition of pricing and wallet health information. This information is available on the approvals dashboard and gives users insight into the actual value at risk of their approvals. This is an important step in helping users understand the risks of their approvals and make better decisions.

![Pricing Information](/assets/images/blog/2023/monthly-update-september/wallet-health.jpg)

If you're an active crypto user it is not unusual to have a dozen or more token approvals, and it can be hard to understand which ones need revoking. In the coming months we want to focus on providing more insight into the risks of your approvals and help you make better decisions. The pricing information and wallet health is the first step in this direction.

## Refactoring & Moving to Viem

Revoke.cash has been using [Wagmi](https://wagmi.sh/) for quite some time, which allows us to easily communicate with all our supported networks. But the team behind Wagmi recently released the [Viem](https://viem.sh/) library, which makes it even easier to build applications on top of Wagmi. So while we waited a bit to make sure Viem was stable, we decided to migrate our codebase to Viem and the latest version of Wagmi this month.

Migrating our entire codebase to Viem and the latest version of Wagmi was a big undertaking, but it will make it easier for us to add new features in the future and should bring performance improvements as well. In the process of moving to Viem we also refactored a lot of other parts of our code, which was also focused on bringing performance improvements and improving the developer experience.

## New Supported Networks

While we support close to 50 different blockchain networks already, we're always looking to add more. And in September we added support for 12 new networks, bringing the total over 60.

New Mainnets:

- [Shibarium](/token-approval-checker/shibarium)
- [Shimmer](/token-approval-checker/shimmer)
- [Rollux](/token-approval-checker/rollux)
- [XDC](/token-approval-checker/xdc)
- [Bitgert](/token-approval-checker/bitgert)
- [Milkomeda C1](/token-approval-checker/milkomeda-c1)
- [Elastos](/token-approval-checker/elastos)
- [Velas](/token-approval-checker/velas)
- [KardiaChain](/token-approval-checker/kardiachain)
- [Pego](/token-approval-checker/pego)
- [WEMIX](/token-approval-checker/wemix)
- [MaxxChain](/token-approval-checker/maxxchain)

New Testnet:

- [Scroll Sepolia](/token-approval-checker/scroll-sepolia)

Unfortunately we've also had to remove support for SmartBCH and Godwoken this month due to a lack of reliable infrastructure for these networks.
