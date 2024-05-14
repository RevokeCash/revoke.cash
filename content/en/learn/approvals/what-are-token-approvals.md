---
title: What Are Token Approvals?
description: Token approvals are used to give permission to a smart contract to spend your tokens on your behalf. Learn more about token approvals.
translator: <Your Name Here (or remove)>
---

# What Are Token Approvals?

Token approvals are used to give permission to a smart contract to spend your tokens on your behalf. This is a common pattern used by decentralized exchanges, lending protocols, and other decentralized applications. For example, if you want to trade your tokens on a decentralized exchange, you will need to give the exchange permission to Swap those tokens on your behalf.

Token approvals are also used with NFTs. For example, if you want to sell your NFT on a marketplace, you will need to give the marketplace permission to transfer your NFT on your behalf. Or if you want to use your NFT as collateral for a loan, you will need to give the lending protocol permission to transfer your NFT on your behalf.

## How Do Token Approvals Work?

In most smart contracts of standard [fungible tokens](/learn/basics/what-are-tokens) and [NFTs](/learn/basics/what-are-nfts), there is a _mapping_ that keeps track of all the approvals that a user has granted, who they have granted it to, and how much / which assets they have granted the approval for. Whenever you grant or revoke one of these approvals, this mapping is updated.

When a contract tries to spend your tokens on your behalf, the token's smart contract then checks this mapping to see if the spender has permission to spend the tokens. If it does, the tokens are spent. If it does not, the transaction fails.

### Fungible Token Approvals

For fungible tokens, smart contracts contain an `approve()` function to grant approval to another address to spend your tokens on your behalf. This function takes two parameters: the address of the spender and the amount of tokens. Revoking an approval is done by calling `approve()` again with the same parameters, but with the amount set to 0.

For example, if you want to grant approval to a decentralized exchange to spend 1000 USDC on your behalf, you would call `approve()` like this:

![Approve USDC](/assets/images/learn/approvals/what-are-token-approvals/erc20-approve.png)

### NFT Approvals

For NFTs, there are two different types of approvals: limited, and unlimited. Limited approvals are used to give permission to a smart contract to transfer a specific NFT (with a specific ID). Unlimited approvals are used to give permission to a smart contract to transfer any NFT within a collection. Limited approvals can only be granted to one address at a time, and because of that, most NFT marketplaces use unlimited approvals.

#### Limited NFT Approvals

For limited approvals, NFT contracts contain an `approve()` function to grant approval to another address to transfer a specific NFT on your behalf. This function takes two parameters: the address of the spender and the ID of the NFT. Revoking this approval is done by calling `approve()` again with the same parameters, but with the spender set to `0x000...`. This kind of approval is also automatically revoked on transfer.

For example, if you want to grant approval to OpenSea to transfer your Pudgy Penguin with ID 4420 on your behalf, you would call `approve()` like this:

![Approve Pudgy Penguins 4420](/assets/images/learn/approvals/what-are-token-approvals/erc721-approve.png)

#### Unlimited NFT Approvals

For unlimited approvals, NFT contracts contain an `setApprovalForAll()` function to grant approval to another address to transfer any NFT within a collection on your behalf. This function takes two parameters: the address of the spender and a true/false value. Approving is done by calling `setApprovalForAll()` with a `true` parameter, while revoking is done using a `false` parameter.

For example, if you want to grant approval to OpenSea to transfer any NFT within your collection on your behalf, you would call `setApprovalForAll()` like this:

![Approve All Pudgy Penguins](/assets/images/learn/approvals/what-are-token-approvals/erc721-setApprovalForAll.png)

### Semi-Fungible Token Approvals

Semi-fungible tokens are a special type of NFT that can be used to represent multiple copies of the same asset. As you can imagine, these tokens have a lot in common with NFTs, so their approval system also looks a lot alike. The biggest difference is that semi-fungible tokens have a `setApprovalForAll()` function, but no `approve()` function.

## Risks of Token Approvals

Token approvals are a core part of the smart contract ecosystem. Without them, a lot of DeFi applications would not be possible. But there are also risks to token approvals. If you give a smart contract permission to spend your tokens, it can spend them at any time. So if the smart contract is hacked or malicious, your tokens can be stolen.

### Smart Contract Exploits

One of the risks of token approvals is that the smart contract you are granting approval to can be hacked. Even established projects can become the victim of a hack, as we saw with the [SushiSwap Exploit](/exploits/sushiswap) in April 2023. In these cases, hackers may be able to steal tokens from your wallet if you've given any approvals to the hacked smart contract.

To help combat this, we created our [exploit checker](/exploits), which contains a list of known smart contract exploits. You can use this tool to check if you have any active approvals to exploited smart contracts.

### Scams and Phishing Attacks

Besides legitimate projects getting hacked, there are also a lot of scams and phishing attacks in the crypto space. These scams often use approvals to steal your money. Some common phishing scams that use approvals are:

1. **Direct Approval to a Scammer**: A scammer trick you into approving a smart contract that they control, allowing them to take the money directly from your wallet.
2. **NFT Marketplace Listings**: A scammer will trick you into signing a signature that lists your assets for sale on an NFT marketplace for 0 ETH, allowing them to "buy" your NFTs for 0 ETH.

Extensions such as the [Revoke Extension](/extension) or [Pocket Universe](https://www.pocketuniverse.app/) can help protect you from these types of scams as they provide warnings when you are about to approve a smart contract. Keeping your approvals to a minimum and regularly [revoking approvals](/learn/approvals/how-to-revoke-token-approvals) can also help protect you from these types of scams, since it limits the amount of damage a scammer can do – especially for marketplace listings.
