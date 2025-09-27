---
title: What Is a Cold Wallet?
description: A cold wallet is a physical device that stores private keys offline, making it more secure than a hot wallet.
translator: <Your Name Here (or remove)>
---

# What Is a Cold Wallet?

As discussed in [our basic guide on crypto wallets](/learn/basics/what-is-a-crypto-wallet), a cold wallet is a secure alternative to a hot wallet that can be used to store your valuable crypto assets long term. A cold wallet makes sure that your private keys are safe, even when you download malware or are the victim of a phishing attack.

## Types of Cold Wallets

The most basic type of cold wallet is a **paper wallet**, which is a piece of paper with your seed phrase written on it, and usually also your wallet address so funds can be sent to it. Because this is just a piece of paper, you can only really use it to receive funds, not to send them. In order to send funds from a paper wallet, you need to first import it into another wallet, which reduces the security of the paper wallet. This is why paper wallets are not recommended for long-term storage.

That is why **hardware wallets** were developed. These are secure physical devices that store your private keys offline, but allow a connection with your computer to send and receive funds. Your keys are secured in such a way that even if your connected computer is compromised, your private keys are still safe on the hardware device. Because of this, hardware wallets are the preferred type of cold wallet for most users.

::img{src="/assets/images/learn/wallets/what-is-a-cold-wallet/hardware-wallets.jpg" alt="Hardware Wallets" width="1200" height="630"}

The most popular hardware wallets are made by [Ledger](https://ledger.com), but other options such as [Trezor](https://trezor.io/) or [Keystone](https://keyst.one/) are also available. More recent versions of hardware wallets like the [Ledger Stax](https://www.ledger.com/products/ledger-stax) have a proper screen to inspect transactions, but earlier versions like the [Ledger Nano S](https://www.ledger.com/products/ledger-nano-s) or [Ledger Nano X](https://www.ledger.com/products/ledger-nano-x) only have a tiny display.

## Hot vs Cold Wallets

Most day-to-day activity is done with a hot wallet, which is a wallet that is stored on your main device and is connected to the internet, such as MetaMask or Rabby. This is convenient, but it also means that your wallet is vulnerable to malware and phishing attacks. If you are the victim of a phishing attack or download malware, your seed phrase can be stolen from that device and you can lose all your assets.

On the other hand, a cold wallet is not connected to the internet and not stored on your main device, making it more secure. Even if your computer is compromised, your cold wallet is safe, because your private keys are not stored on the compromised device.

## Token Approvals on Cold Wallets

When we speak about a cold wallet, we don't *just* mean that the private keys are stored physically, but also that you're not exposing the wallet to any other unnecessary risks. That means that in addition to using a hardware device, proper cold wallets should also have no token approvals. If you have token approvals, you're exposing your wallet to the risk of being scammed or hacked.

## Warm Wallets

We've discussed hot and cold wallets, and we've stressed the importance of limiting approvals and smart contract interactions on a cold wallet, while it is less important to do the same for a hot wallet. However, there's also a middle ground, which we can call a warm wallet. A warm wallet is for those security-minded users who want to interact with smart contracts and DeFi, but still don't want to put their seed phrase at risk.

With a warm wallet, you still use a hardware device to store your private keys, but you can connect it to your computer and use it for day-to-day trading. Because they are exposed to token approvals and DeFi interactions, they are less secure than a proper cold wallet, but because they still keep your seed phrase safe, they are more secure than a hot wallet.

## Three Address Protocol (TAP)

To get the best of both worlds, we recommend using the three address protocol (TAP). With TAP, you split up your assets into three wallets: you use a hot wallet for everyday minting and active trading on DEXes, a warm wallet for interacting with DeFi and buying/selling NFTs in the medium term, and a proper cold wallet for long-term storage.

::img{src="/assets/images/learn/wallets/what-is-a-cold-wallet/three-address-protocol.jpg" alt="Three Address Protocol" width="1560" height="860"}

The hot wallet should never contain more than a small amount of funds but can have token approvals and smart contract interactions. The cold wallet should contain your most valuable assets and should have no token approvals and smart contract interactions. And the warm wallet sits right in the middle, containing your medium-term assets and allowing you to interact with some smart contracts and DeFi.
