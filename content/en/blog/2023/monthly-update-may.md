---
title: 'Monthly Update: May 2023'
description: In May we launched a lot of new features, such as our new Exploit Checker that can quickly tell you if you're exposed to crypto exploits, support for cancelling / invalidating offchain signatures and translations into new languages.
date: 2023-05-31
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# Monthly Update: May 2023

In May we launched a lot of new features, such as our new Exploit Checker that can quickly tell you if you're exposed to crypto exploits. We also added support for cancelling / invalidating offchain signatures which can be helpful if you realise that you signed something on a phishing website. We also expanded our internationalisation efforts with translations into Japanese and Russian. Read on to learn more about what we did in May.

## Exploit Checker

In April we saw SushiSwap get exploited for over three million dollars, with approved funds at risk. This exploit shook the crypto community and saw thousands of users flock to Revoke.cash to check if they were at risk. During this ordeal we realised that we needed to make it easier for users to check if they were at risk. So in May we released our Exploit Checker.

![SushiSwap Exploit Checker](/assets/images/blog/2023/monthly-update-may/sushiswap-exploit-checker.png)

The inspiration for this exploit checker came from our friends at [ScamSniffer](https://www.scamsniffer.io/), who had been requesting a way to add custom filters to Revoke.cash that they could share with their users. This was a great idea, but there can be some security issues with allowing that level of flexibility. So we decided to build on top of this idea and create a way for users to check if they were at risk from a specific exploit.

For this we enlisted the help of our friend [Dries](https://twitter.com/Steen3S), who did most of the heavy lifting to realise this feature. After programming the new feature we also spent a lot of time sifting through years and years of tweets, blog posts and articles to find all the approval-based exploits that we could find. We then added these to the Exploit Checker, so that users could check if they were at risk from these exploits.

## Cancelling Signatures

A popular question we get is whether it's possible to cancel offchain signatures. And the answer is not that clear. It depends on the type of signature, and every different type of signature has its own rules. Additionally, because these signatures are offchain, there's no way to know whether you signed any of them. These issues make it pretty hard to cancel offchain signatures.

![Cancel Signatures](/assets/images/blog/2023/monthly-update-may/cancel-signatures.png)

Our new signatures tab on the Approvals Dashboard allows you to cancel two kinds of signatures that are often-used by phishing websites. The first is the _Permit_ signature, which can be used to grant token approvals with a gasless signature. The second are marketplace signatures, which authorise asset transfers for tokens and NFTs with active approvals on marketplaces like OpenSea and Blur.

Even though we added this feature, we can unfortunately still not provide an overview of all the signatures that you've signed, because they are not available onchain. So you will need to determine by yourself whether you signed any of these signatures. We recommend only using this functionality if you're sure that you signed a signature that you want to cancel. While it is not dangerous to cancel signatures needlessly, it does cost gas every time you do it.

## Russian and Japanese translations

Crypto is an incredibly global and diverse industry. And after we attended Devconnect in Colombia last year we realised that we needed to do more to support our international users, so we started with Spanish and Chinese translations. And to continue our internationalisation efforts we added support for Russian and Japanese translations this month. If there are any languages that you'd like to see us support, please let us know.

## New Supported Networks

While we support over 40 different blockchain networks already, we're always looking to add more. And in May we added support for 1 new network.

- [Wanchain](/token-approval-checker/wanchain)
