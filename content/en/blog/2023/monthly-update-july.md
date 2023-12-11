---
title: 'Monthly Update: July 2023'
description: In early July we discovered a very tricky new scam that attempts to exploit Revoke.cash users and users of other approval management tools such as BscScan. We made sure Revoke users are safe and educated the community about this new scam.
date: 2023-07-31
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# Monthly Update: July 2023

In early July we discovered a very tricky new scam that attempts to exploit Revoke.cash users and users of other approval management tools such as BscScan. We spent some time on making sure Revoke users are safe and educating the community about this new scam. After making sure everyone was safe, we went on a very welcome holiday to Italy. Read on to learn more about what we've been up to in July.

## New Scam: Fake Approvals

Scammers are always looking to find ways to trick you into giving them your money. And in July we discovered a new scam that attempts to exploit Revoke.cash users and users of other approval management tools such as BscScan. This scam involved malicious actors creating _spam tokens_ that resemble popular tokens such as USDC or WBNB.

These fake tokens are programmed to come with some risky looking approval, but when you try to revoke the approval, the transaction would have a very high gas cost because it is programmed to mint a lot of so-called "gas tokens". These gas tokens essentially convert transaction fees into a token format, which can then be sold on the market for a profit.

![Gas Fee Check](/assets/images/blog/2023/monthly-update-july/gas-fee-check.png)

This kind of scam is especially worrisome, because victims could be using the official websites of approval management tools and still get scammed. Luckily our existing spam filters were able to detect 99% of these fake tokens, but we still wanted to make sure that our users were 100% safe. That's why we've added checks to the website to make sure that you can't revoke approvals when the transaction fees are unreasonably high.

As far as we know, no users of Revoke.cash have been affected by this scam. And because of the extra measures we've taken, we're confident that our users will be safe from this scam in the future as well. Other token approval management tools may still be vulnerable to this scam, so please be careful when using other tools.

## Revoke.cash Team in Italy

After making sure everyone was safe from the fake approvals scam, we went on a very welcome holiday to Italy. We spent two weeks in Sardinia, where together with some of our friends from the crypto space we rented an airbnb and enjoyed the beautiful beaches and delicious food.

![Italy](/assets/images/blog/2023/monthly-update-july/italy.jpg)

## Fixes and Improvements

Besides these larger changes we're also always making smaller updates that improve the overall experience of using Revoke.cash and keep the website running. This month we've expanded our address labels, improved the FAQ page and made some updates to our signature management page.

![Exploit Indicators](/assets/images/blog/2023/monthly-update-july/exploit-indicators.jpg)

To make it easier to see if you're affected by exploits, we also added warning indicators to the main approvals dashboard, warning you of any exploited contracts that you may have approved. And we've also added dynamic social preview images for exploits, so that you can easily share exploit information on social media.

## New Exploits

This month saw two big smart contracts exploits in which approved funds may be at risk. Crypto fund CivFund was exploited for close to $200k, which drained its users' approved funds. But this smaller hack was overshadowed by the much larger exploit of the popular cross-chain bridge Multichain (previously known as AnySwap). This exploit resulted in over $100 million in losses. And although no approved funds were stolen, it seems that the admin keys of the Multichain bridge were compromised, which means that approved funds may be at risk. You can check if you're affected by these exploits below:

- [CivFund](/exploits/civfund)
- [Multichain](/exploits/multichain-2023)

## New Supported Networks

While we support over 40 different blockchain networks already, we're always looking to add more. And in July we added support for 3 new networks.

New Mainnets:

- [Base](/token-approval-checker/base)
- [Linea](/token-approval-checker/linea)
- [Dogechain](/token-approval-checker/dogechain)

New Testnets:

- [ZetaChain Athens](/token-approval-checker/zetachain-athens)
- Taiko Alpha
