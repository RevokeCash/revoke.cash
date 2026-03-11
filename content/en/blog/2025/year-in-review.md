---
title: '2025: Year in Review'
description: In 2025 we shipped single-transaction batch revoking, which was enabled by the new EIP7702 standards, and we were also able to add some features that had been on our backlog for a long time, such as the history tab and the delegations tab.
date: 2025-12-31T13:00:00Z
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# 2025: Year in Review

2025 saw big improvements in the user experience of Revoke.cash, the biggest of which was the introduction of single-transaction batch revoking, enabled by the new EIP7702 standard on Ethereum mainnet and several other networks. We were also able to add some features that had been on our backlog for a long time, such as the history tab and the delegations tab.

## Single-Transaction Batch Revoke

We initially introduced batch revoking in 2024, but back then it was only possible to batch revoke in multiple queued transactions. This was already a big improvement in convenience, but it was still not possible to batch revoke in a single transaction, due to the way that the ERC20 and ERC721 token standards work.

::img{src="/assets/images/blog/2025/update-q2/batch-revoke.jpg" alt="Batch Revoke" width="2160" height="1520"}

However, this all changed with the introduction of the new EIP7702 standard on Ethereum mainnet and several other networks. This standard allows for account abstraction, the biggest feature of which is the ability to batch multiple actions into a single transaction.

We worked hard and were able to use this new standard to ship support for single-transaction batch revoking as soon as the standard was live - becoming the first application to support it. This represents a huge improvement in the user experience of Revoke.cash, bringing the time spent revoking approvals from minutes to seconds.

## History, Delegations, and Coverage Tabs

Inspecting and revoking token approvals has always been *the* core functionality of Revoke.cash. However, it is not the *only* thing that matters in the world of crypto security. That is why we're happy that we were able to start expanding the scope of Revoke.cash to include more security-related features. Over the course of 2025, we added three new tabs to the Revoke.cash account dashboard: **History**, **Delegations**, and **Coverage**.

::img{src="/assets/images/blog/2025/update-q4/history-tab.jpg" alt="History Tab" width="2000" height="1000"}

On the **History** tab you can see a list of every approve and revoke action that your wallet has performed. This can be very useful when you're the victim of a scam or a hack, as it allows you to see exactly how and when your approvals were granted.

On the **Delegations** tab you can see a list of all the delegations that your wallet has active. This includes delegations that were made through delegation platforms like **Delegate.xyz** and **Warm.xyz**, but it also includes EIP7702 delegations.

::img{src="/assets/images/blog/2025/update-q2/delegations-tab.jpg" alt="Delegations Tab" width="3456" height="1924"}

On the **Coverage** tab you can manage crypto insurance / coverage for your wallet. The current version only supports Fairside, but we're planning to add support for other coverage providers in the future, such as Nexus Mutual.

## Team Updates

Revoke.cash started as a solo project back in 2019, but in 2024 the team grew to include [Dries](https://x.com/Steen3S) and [WiiMee](https://x.com/wiimee) as part time team members, with Dries helping with the development of Revoke.cash and WiiMee helping with educational content and community engagement. Dries had his own projects on the side, and in 2025 his own company grew to the point where he had to focus on it full time.

For some time in 2025, [Chidozie](https://x.com/abraham_loner) also joined the team as a part time software engineer, but unfortunately revenue has been very low in 2025, and we decided that we had to keep the team as small as possible. At the same time, we did bring on Stefan in a part time business development role to help us with finding new sources of funding and partnerships to get revenue back up.

## Monetisation & Sustainability

Revoke.cash has always been a public good, fully funded by grants, donations and other public goods funding initiatives. However, across the crypto ecosystem, we have noticed a significant decline in public goods funding and it has become impossible to sustain our project without a sustainable funding model.

During most of the year, we've tried to find new sources of grants and public goods funding, and we even added Stefan to the team to help with this, and we've started collecting data on the impact that Revoke.cash has on the web3 space. But unfortunately, this still did not result in any new funding.

::img{src="/assets/images/blog/2025/update-q2/prevented-losses.png" alt="Prevented Losses Statistics" width="1920" height="1080"}

Since no foundations have been willing to provide much-needed grant funding to support Revoke.cash as a public good, we had to make the tough decision to start monetising the service itself in order to sustain it. While this means that we have to start charging our users for some features, our philosophy is unchanged: Revoke.cash remains a free and open source public good. All of the core security tools will remain fully free to use, while additional convenience features will be available for a fee.

::img{src="/assets/images/blog/2025/update-q4/batch-revoke-fee.jpg" alt="Batch Revoke Fee" width="2000" height="1000"}

To start this monetisation model, we have introduced a batch revoke fee. This fee is a small one-time fee that you pay when you batch revoke your approvals. You can always revoke the approvals one by one for free, but if you want to save time by batching, you'll now pay a fee of $1.50 per batch. Looking forward to 2026, we're planning to add more paid features to the service, which will be focused on improving the user experience and making it even easier to stay safe in the web3 space.

## Token Approval Exploits

In terms of token approval exploits, 2025 was a relatively good year, without any incredibly large exploits. We did see quite a few smaller exploits and a few multi-million dollar exploits, but overall the year was relatively quiet. In the end, 2025 saw 9 token approval exploits with just over $6m of stolen funds, which is a significant decrease from the $80m of stolen funds in 2024.

It is still uncertain whether the decrease in token approval exploits is due to improved security practices or due to other external factors. We hope to see many people continue to use Revoke.cash in order to keep these losses to a minimum in 2026 as well.

## Looking Forward to 2026

The big focus in 2026 is on sustainability as a company and as a public good. We've been hard for over six years to keep our users safe and provide valuable support to the web3 space, and we now need to make sure that we can continue doing that for the next six years without needing to spend a lot of time chasing funding.

A big part of our strategy for 2026 is to focus on improving the user experience of Revoke.cash and to help provide more guidance to our users on how to stay safe in the web3 space. If there's anything you'd like to see in 2026, please let us know!
