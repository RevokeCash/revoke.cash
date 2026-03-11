---
title: What Is EIP7702?
description: EIP7702 is a standard for adding smart contract functionality to a wallet. It can be used to enable things like batch transactions and more.
translator: <Your Name Here (or remove)>
---

# What Is EIP7702?

In the Ethereum ecosystem, there has always been a divide between "normal" user wallet (aka "Externally Owned Accounts" or EOAs) and smart contracts. EOAs are simple wallets that are controlled by a single private key, while smart contracts are controlled by the code of the contract.

The code of a smart contract can contain all kinds of functionality, from simple token transfers to complex interactions with other smart contracts. In the past, there have been attempts to add smart contract functionality to regular users, enabling more complex functionality.

::img{src="/assets/images/learn/wallets/what-is-eip7702/safe-wallet.jpg" alt="Safe Wallet" width="1200" height="660"}

One example of this is [Safe](https://safe.global/), which uses a smart contract to create wallets that can be controlled by multiple owners. Other projects such as [Ambire](https://ambire.com/) also used smart contracts to create wallets with more complex functionality.

But it has always been a complex process to move over to these wallets, and existing EOAs were not able to use this functionality. That is where EIP7702 comes in. EIP7702 is a standard that allows normal EOAs to use the same functionality as smart contracts, by setting a "delegate" smart contract that can act on their behalf.

## The Benefits of EIP7702

EIP7702 allows EOAs to use the same functionality as smart contracts. Right now, that is mostly used for batching transactions, such as combining token approvals + token swaps into a single transaction on Uniswap, or revoking dozens of token approvals in a single transaction on Revoke.cash.

::img{src="/assets/images/learn/wallets/what-is-eip7702/approve-and-swap.jpg" alt="EIP7702 Approve + Swap" width="1200" height="800"}

In the future, these wallets will likely contain even more interesting features, such as scheduled transactions or automated actions. This makes EIP7702 a very powerful tool for users, especially for hot wallets that are used for day-to-day activity.

## The Risks of EIP7702

While the benefits of EIP7702 outweigh the risks, there still are some risks to consider. And the main risks are twofold: smart contract risk and phishing risk.

### Smart Contract Risk

Normal EOAs have been around for a long time, and while their functionality is limited, we know exactly that they behave predictably. When we add a smart contract into the equation, we are introducing a new layer of complexity. The big wallets like MetaMask have rigorous security audits and tests to ensure that the smart contract is safe to use, but smaller wallets may not have the same level of security.

And even if the smart contract is safe to use, all added complexity can be an extra risk, especially when dealing with large amounts of assets.

### Phishing Risk

Normal EOAs are limited in what they can do. When you're trying to be productive, that is a limiting factor. But being limited in what you can do does offer some level of protection from phishing attacks. If you visit a phishing website, scammers can often only trick you into sending one asset at a time.

::img{src="/assets/images/learn/wallets/what-is-eip7702/eip7702-phishing.jpg" alt="Phishing Risk" width="1200" height="700"}

With EIP7702 batch transactions, you can now send multiple assets at once. This means that if you visit a phishing website, scammers can trick you into sending multiple assets at once. So before you realise, you might have already sent all your assets to a malicious smart contract. When using EIP7702, it is extra important to double check what you're approving.

### Other Risks

On other websites you might read horror stories about EIP7702 being used to completely drain wallets and put a so-called sweeper bot to work that steals all assets as soon as they are sent to your wallet.

::img{src="/assets/images/learn/wallets/what-is-eip7702/scam-delegate.jpg" alt="Scam Delegate" width="1200" height="600"}

While it is true that EIP7702 can be used to facilitate this, it is *only* possible if your seed phrase is compromised. And if your seed phrase is compromised, then your entire wallet is already lost, so EIP7702 is not the cause of the loss in the first place.

## Enabling EIP7702 Delegations

We discussed the benefits and the risks of EIP7702. While the benefits outweigh the risks, it is prudent to only enable EIP7702 on hot wallets that you are using for day-to-day activity. For cold wallets that you use for long-term storage, it is better to keep it simple and use a regular EOA.

::img{src="/assets/images/learn/wallets/what-is-eip7702/enable-eip7702.jpg" alt="Enable EIP7702" width="1200" height="720"}

Wallets will prompt you automatically to enable EIP7702 when you use a dapp that supports batch transactions, like batch revoking on Revoke.cash. So you don't need to do anything in your wallet settings manually, but only need to approve the delegation when you use the dapp.

## Revoking EIP7702 Delegations

On Revoke.cash, you can inspect all your EIP7702 delegations in the *delegations* tab on your account page. However, you cannot revoke them from there. Most wallets do not allow external dapps (like Revoke.cash) to enable or revoke EIP7702 delegations, meaning that you need to revoke them inside your wallet application.

::img{src="/assets/images/learn/wallets/what-is-eip7702/revoke-eip7702.jpg" alt="Revoke EIP7702" width="1000" height="432"}

## Bottom Line

EIP7702 is a powerful tool that adds a lot of functionality to your wallet. But it is important to remember that it also introduces some risks, especially when dealing with large amounts of assets. So if you're an active DeFi user, EIP7702 can save time and gas. If you’re a long-term holder, stick to the simplicity of an EOA.
