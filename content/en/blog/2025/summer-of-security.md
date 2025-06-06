---
title: 'Summer of Security: Revoke for Free, Every Week'
description: At Revoke.cash, we’ve always encouraged users to make revoking token approvals a regular habit. That is why we've partnered with Candide to sponsor gas fees for one batch revoke per week per user.
date: 2025-06-03
author: Rosco Kalis
translator: <Your Name Here (or remove)>
overlay: false
---

# Summer of Security: Revoke for Free, Every Week

At Revoke.cash, we’ve always encouraged users to make revoking token approvals a regular habit. It’s one of the simplest and most powerful things you can do to reduce the risk of scams and hacks.

But let’s be honest: no one loves paying gas fees. Even a small fee can feel like a hurdle when you’re just trying to stay safe. So this summer, we’re making it easier than ever to clean up your wallet.

We’ve integrated with [Candide](https://candide.dev/) to sponsor your gas fees for **one free batch revoke per week**. That means every week, you can revoke some token approvals without spending a single cent on gas.

## Why Revoking Matters

Over time, we grant token approvals to dozens (sometimes hundreds) of smart contracts. These approvals linger long after we stop using a project, quietly sitting there with access to our tokens. If one of those contracts is ever compromised, your assets could be at risk.

Regularly revoking approvals is the crypto equivalent of locking your doors. And now, thanks to our gas sponsorship, there's no excuse not to.

## Who Can Use It?

To take advantage of the free revoke sponsorship, you’ll need a wallet that supports EIP-4337 Paymasters, such as [Ambire](https://ambire.com/) or [Coinbase Smart Wallet](https://www.coinbase.com/wallet/smart-wallet) (not the "regular" Coinbase Wallet). You also need to use one of the following networks:

- Optimism
- Base
- Arbitrum
- BNB Chain
- Polygon
- Gnosis Chain
- Celo

If you're using a supported wallet and you're on one of these chains, you’re good to go.

## How Does It Work?

We’ve integrated with **Candide’s InstaGas** service — a Paymaster API designed to sponsor gas fees for user operations on EIP-4337 wallets.

![Instagas](/assets/images/blog/2025/summer-of-security/instagas.png)

Here’s what happens behind the scenes:

1. When you send a batch revoke on any of the supported networks, we send so-called paymaster information to the wallet along with the transaction request.
2. If the wallet supports EIP-4337, it will communicate with the paymaster (powered by Candide InstaGas) to cover the gas fee for the transaction.
3. If the transaction is eligible, then it is sent to the network in such a way that *we* pay the gas fees while you revoke.


We have set up and funded a gas policy that only allows a single batch revoke per week per user. If you've already used the free batch revoke, then we simply don't cover the gas fee for the transaction, and you will be charged the regular gas fee. All of this happens seamlessly, with no complicated setup on your part. Just click *revoke* and let us take care of the rest.

## Try It Now

Ready to clean up your wallet for free? Connect with a supported wallet and enjoy your free weekly revoke, all summer long.
