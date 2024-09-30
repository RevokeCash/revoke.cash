---
title: You’ve Been Scammed, Now What?
description: Scams are a common occurrence in crypto and cause hundreds of millions of dollars in losses every year. Understand how these scams happen and what to do when you get scammed.
translator: <Your Name Here (or remove)>
---

# You’ve Been Scammed, Now What?

Scams are unfortunately still a common occurrence in the crypto space. They can take many forms, from phishing websites to rug pulls, and cause hundreds of millions of dollars in losses every year, as reported by [ScamSniffer](https://scamsniffer.io/) in their [2023 report](https://drops.scamsniffer.io/post/scam-sniffer-2023-crypto-phishing-scams-drain-300-million-from-320000-users/).

![ScamSniffer Report 2023](/assets/images/learn/security/what-to-do-when-scammed/scamsniffer-report.jpg)

One of the most common questions we see asked on our Discord and Twitter is:

> I’ve just been scammed, what can I do about it?

To best answer this question, we need to understand the nature of the scam and how it happened. This article will help you identify the root cause of your loss and provide you with the necessary steps to take to prevent it from happening again. There are many ways in which you can be scammed, so the first step is to identify what was stolen.

## What was stolen?

To understand what happened, it is important to _fully_ answer the question of _"what was stolen?"_. Did many different assets get stolen across multiple networks or wallets, then it is very likely that your seed phrase or private keys were compromised. If multiple assets weres stolen that had been approved for a specific smart contract, then it might be a _marketplace signature_ scam. If only one specific asset was stolen, then it might be a direct transfer or approval to a malicious smart contract.

![Flowchart](/assets/images/learn/how-did-i-get-scammed-light.png)

We created this flowchart to help you better understand these possibilities and pathways. It's important to understand that these are general guidelines and that each case is unique. But this flowchart and the information in this article can help you understand what happened and what you can do about it. If you are still unsure about what happened, please reach out on [Discord](https://discord.gg/revoke-cash).

## Seed Phrase Compromise

![Seed Phrase Compromise](/assets/images/learn/security/what-to-do-when-scammed/seed-phrase-compromise.jpg)

If several tokens have been stolen out of your wallet, then it is possible that your seed phrase or private keys have been compromised. This suspicion is further confirmed if the tokens were taken across multiple blockchains and/or multiple wallet addresses. If the native token of the blockchain (e.g. ETH, POL or BNB) gets stolen immediately after you deposit it into the compromised wallet, then you can be certain that your seed phrase has been exposed.

### How does this happen?

There are several ways in which your seed phrase can be compromised. One of the most common ways is through malware - for example, you downloaded a _video conferencing app_ or a _game launcher_ that was sent to you through a social media interaction. These apps usually contain malware that scans your computer for wallets (like MetaMask or Rabby) or other crypto-related applications and steals the data.

Other common ways in which your seed phrase can be compromised include getting tricked into entering it on a phishing website or storing a digital copy of your seed phrase in a cloud service like Google Drive or iCloud and having that account compromised.

### What can be done?

The seed phrase compromise is the **most destructive** form of scam, as it gives the attacker full control over your wallet. If your seed phrase has been compromised, there is _nothing_ you can do to "re-secure" your wallet or regain control over it. The affected wallet addresses need to be abandoned.

Nevertheless there are important steps to take when this happens. The first step is to run a malware check on your computer to ensure that the attacker does not have access to any other sensitive information. If needed, it may even be wise to do a complete reset of your computer (after backing up any important data). It is also adviced to change important passwords if you're unsure how your seed phrase was compromised exactly.

When you're confident that your computer is clean, you can create a new wallet (preferably a hardware wallet) and transfer any remaining assets to it. Often times transfering assets to a new wallet can be hard due to the attacker using a sweeper bot to steal any assets that end up in your wallet. So if you have more than $1000 worth of assets left in the compromised wallet, it is recommended to reach out to the [Flashbots Whitehat Hotline](https://docs.flashbots.net/whitehat) for help.

### How can this be prevented?

The best way to prevent seed phrase compromise is to use a hardware wallet, such as Ledger, Trezor or Keystone. Even if your computer or digital accounts get compromised, the attacker will not be able to access your wallet without the hardware device. When using a hardware wallet, it is important to never enter your seed phrase into any digital device (even as a backup), as this defeats the purpose of the hardware wallet.

## Marketplace Signatures

![Marketplace Signatures](/assets/images/learn/security/what-to-do-when-scammed/marketplace-signature-scams.jpg)

If multiple tokens and NFTs were stolen from your wallet that were all approved for a specific smart contract, such as OpenSea, Blur or Permit2, then it is likely that you fell victim to a _marketplace signature_ scam. These scams are usually a "one and done" event, meaning that the attacker can only steal your assets once - unless you signed multiple requests.

### How does this happen?

Marketplace signature scams usually happen when a user visits a phishing website without realizing it. The user is then asked to sign a gasless signature to a marketplace or service like OpenSea, Blur or Uniswap's Permit2 contract. By signing the signature request, the user creates an authorization for the attacker's wallet to "buy" all of the user's already approved assets for no countervalue.

While we mentioned that seed phrase compromise is the most destructive form of scam, marketplace signatures are not far behind. While the damage is usually limited to a single wallet, a single blockchain and pre-approved tokens or collections, the attacker _can_ steal all of these pre-approved assets in _one signature_, making this a very dangerous scam.

Because multiple assets are stolen in one go, it is easy to confuse this kind of scam with a seed phrase compromise. So it is important to check the blockchain explorer to see how the assets were stolen. If the _marketplace signatures_ method is used, no direct transfers will appear, but functions such as "MatchOrders" or "BulkExecute" will be visible when looking at ERC721 or ERC20 transfers. This can be confirmed by verifying the approvals on [Revoke.cash](https://revoke.cash/). If assets are stolen across multiple blockchains or wallets, then it is more likely that your seed phrase has been compromised.

### What can be done?

Once this kind of signature has been signed, there is one thing you can do to _prevent_ it from activating: _cancel signatures_ on the Revoke.cash Signatures page. However, the time window to cancel these signatures is very small, and once your assets have been stolen, there is no way to get them back.

Because this is a "one and done" event, you can continue to use your wallet without needing to take any further action. However, it is important to follow the prevention steps below to ensure that this does not happen again in the future.

### How can this be prevented?

The best way to limit the impact of marketplace signature scams is to revoke approvals on a regular basis, especially to marketplace contracts like OpenSea, Blur or Permit2. Any approvals to these kinds of contracts are marked as potentially risky on Revoke.cash, so it is important to check these regularly and revoke any that you are not actively using.

![Phishing Risk Warning](/assets/images/learn/security/what-to-do-when-scammed/phishing-risk-warning.jpg)

Besides keeping an eye on your approvals, it is also important to double check URLs of any website you visit, especially when signing transactions or gasless signatures. If there are any crypto websites that you visit regularly, such as OpenSea or Revoke.cash, then it is a good idea to bookmark these websites to ensure that you are always visiting the correct URL.

Finally, using security browser extensions, such as the [Revoke extension](/extension) or [Pocket Universe](https://www.pocketuniverse.app/) can help warn against these kinds of scams and keep you from signing malicious transactions.

## Token Approvals

![Token Approvals](/assets/images/learn/security/what-to-do-when-scammed/token-approvals.jpg)

If only one specific asset was stolen from your wallet, then it is likely that you signed a direct transfer or approval to a malicious smart contract. This can be verified by checking Revoke.cash for any recent approvals to unknown smart contracts. While this is usually only for a single asset, it is also possible that you lose multiple assets if you sign multiple consecutive transactions.

### How does this happen?

As with marketplace signatures, this kind of scam exclusively happens when a user visits a phishing website. The user is then tricked into signing a token approval transaction or a gasless _Permit_ signature to a malicious smart contract. The attacker can then use this approval to transfer the user's assets to their own wallet.

If you sign multiple consecutive transactions, the attacker can steal multiple assets from your wallet, which can make it seem like a seed phrase compromise or marketplace signature scam. So you can always double check by looking at your recent token approvals on Revoke.cash.

### What can be done?

If you signed one or multiple token approvals to a malicious smart contract, the first thing you should do is revoke these approvals on Revoke.cash. This will prevent the attacker from stealing any more assets in the future. If you do not revoke these approvals, the attacker can continue to steal your assets until the approval is revoked.

Once you have revoked the approvals, you can continue to use your wallet as normal. However, it is important to follow the prevention steps below to ensure that this does not happen again in the future.

### How can this be prevented?

Similar to marketplace signatures, the best way to prevent token approval scams is to double check URLs of any website you visit, bookmarking any crypto websites you visit regularly and using security browser extensions. By following these steps, you can make sure that you are always visiting the correct website and not falling victim to a phishing scam.

## Direct Transfers

![Direct Transfers](/assets/images/learn/security/what-to-do-when-scammed/direct-transfers.jpg)

If only one specific asset was stolen from your wallet, then it can be either a direct transfer or token approval. If there are no unexpected approvals on Revoke.cash, then it is most likely a direct transfer of the asset in question. These transfers often come disguised as named functions, such as "Security Update", "Claim" or "Claim Rewards".

### How does this happen?

As with marketplace signatures and token approvals, direct transfers happen when a user visits a phishing website. The user is then tricked into signing a direct transfer of the asset in question to the attacker's wallet. Often times these transfers are disguised as named functions, such as "Security Update", "Claim" or "Claim Rewards" so that the user does not realize what they are signing.

If you sign multiple consecutive transactions, the attacker can steal multiple assets from your wallet, which can make it seem like a seed phrase compromise or marketplace signature scam. One way to be sure is to send a small amount of the native token (e.g. ETH, POL or BNB) to the compromised wallet. If this token gets does not get stolen immediately, then it is likely that you fell victim to a direct transfer scam.

### What can be done?

Similar to marketplace signatures, this is a "one and done" event, meaning that the attacker does not have continuous access to your wallet. Once the asset has been stolen, there is no way to get it back. However, you can continue to use your wallet as normal, as long as you follow the prevention steps below to ensure that this does not happen again in the future.

### How can this be prevented?

Similar to marketplace signatures and token approvals, the best way to prevent token approval scams is to double check URLs of any website you visit, bookmarking any crypto websites you visit regularly and using security browser extensions. By following these steps, you can make sure that you are always visiting the correct website and not falling victim to a phishing scam.

## Combinations of Scams

![Combinations of Scams](/assets/images/learn/security/what-to-do-when-scammed/combinations-of-scams.jpg)

In this article we discussed the most common forms of scams individually, but it is also possible that scammers use a combination of these methods to steal your assets. For example, a scammer might trick you into signing a marketplace signature and then also trick you into signing a direct transfer. This can make it difficult to understand what happened and what you can do about it.

If you are unsure about what happened after reading this article, we're always willing to take a look at your case on [Discord](https://discord.gg/revoke-cash) to help you understand what happened and what you can do about it.

## Final Word of Advice

When you get scammed there is no way to recover any stolen assets and anyone who promises to do so is likely a scammer themselves. Because of this, the best way to protect yourself is to prevent these scams from happening in the first place by using the prevention steps outlined in this article.

And while there is no way of recovering stolen assets on the blockchain, it can still be a good idea to report your case to local authorities or submit reports to exchanges. That way there is at least a paper trail of your case and a _theoretical_ chance that some of your losses might be recovered when the fraudsters are caught.
