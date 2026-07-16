---
title: What Are NFTs (Non-Fungible Tokens)?
sidebarTitle: What Are NFTs?
description: NFTs are unique digital assets that can be bought and sold. Each NFT is unique, and cannot be replaced by another NFT. Learn more about NFTs.
translator: <Your Name Here (or remove)>
---

# What Are NFTs (Non-Fungible Tokens)?

A Non-Fungible Token, or NFT, is an individually identifiable digital token that exists on a blockchain. NFTs can represent many different things, including digital art, collectibles, game items, memberships, tickets, domain names and financial positions. What makes them different from regular crypto tokens is that each NFT can have its own identity and properties.

For example, one USDC token is interchangeable with another USDC token. But one NFT may have different artwork, attributes, ownership history or utility from another NFT in the same collection. In simple terms: fungible tokens represent interchangeable units, while NFTs represent distinct assets.

## What Does Non-Fungible Mean?

An asset is fungible when one unit can be exchanged for another equivalent unit. For example, one US Dollar is generally interchangeable with another US Dollar. Similarly, one ETH is interchangeable with another ETH. NFTs are non-fungible because each token can be individually identified. Even when two NFTs belong to the same collection, they may have different token IDs, properties or values.

This does not necessarily mean every NFT is completely unique. Some NFT standards allow multiple copies of the same item to exist. The important distinction is that NFTs can represent individually identifiable assets rather than interchangeable units of a currency.

## How Do NFTs Work?

Most NFTs are created and managed by smart contracts. The NFT smart contract keeps track of information such as:

- Which NFTs exist
- The unique token ID of each NFT
- Which wallet owns each NFT
- How NFTs can be transferred
- Which addresses or applications are allowed to manage them
- Where the NFT's metadata can be found

When you transfer an NFT, the image or underlying item is not moved from one device to another. Instead, the smart contract updates its records to show that a different blockchain address now owns the token. Your wallet allows you to access the address that owns the NFT and sign transactions involving it.

## What Does Owning an NFT Mean?

Owning an NFT means that your blockchain address is recorded as the owner of that particular token. What this ownership gives you depends on the project and the NFT's terms.

An NFT may provide:

- Ownership of a blockchain token
- Access to a community, product or event
- The ability to use an item in a game or application
- Voting or participation rights
- A claim on another asset or position
- Certain commercial or licensing rights

However, owning an NFT does not automatically mean that you own the copyright to the associated image, video, music or other media. Copyright and commercial rights are determined by the terms set by the creator or project. Some NFT holders receive broad commercial rights, while others only own the token itself and a limited right to display the associated media.

## Where Is the NFT Image Stored?

The NFT itself exists on the blockchain, but the associated image or media is not always stored there. An NFT usually contains metadata that describes the asset. This metadata may include its name, image, attributes and other information. NFT metadata can be stored in different ways:

- Directly on the blockchain
- On decentralized storage networks such as IPFS or Arweave
- On a centralized server controlled by the project

Fully on-chain NFTs store their metadata and media directly on the blockchain itself. Because the data is stored directly in the blockchain's state or transaction history, it is generally much harder to alter or remove than content hosted on an external server. However, storing large amounts of data on-chain is expensive and technically limiting, which is why fully on-chain NFTs are less common.

Many NFTs instead store only a reference on-chain, such as a link or pointer to where the actual image or metadata is hosted. This external storage may be on decentralized networks like IPFS or Arweave, or on centralized servers controlled by the project team.

When content is stored off-chain, there is a risk that it may become unavailable in the future. For example, if a project stops maintaining its servers, stops paying for hosting, or removes the files, the NFT may still exist on the blockchain but no longer display its associated image or data.

This means owning an NFT does not guarantee that all of its associated content will remain accessible or permanently preserved unless that content is stored directly on-chain or on a durable decentralized storage network.

## Types of NFTs

NFTs can be used to represent many different types of digital and physical assets.

### Art and Collectibles

Art and collectible NFTs represent digital artwork, avatars, trading cards and other collectible items. Some collections contain individually created artwork, while others use algorithms to generate different combinations of visual traits. The distinction between digital art and collectibles is often unclear. An NFT can function as both an artwork and a collectible.

### Gaming Items

Gaming NFTs can represent characters, skins, weapons, virtual land and other in-game assets. Unlike traditional game items, blockchain-based items can potentially be held in a user's own wallet, transferred outside the original game and, depending on the project, sold or traded by the owner.

However, the usefulness of a gaming NFT still depends on the game or application supporting it. Owning the token does not guarantee that the game will continue operating or that the item will remain useful.

### Memberships and Access Passes

NFTs can be used as digital memberships, subscriptions or access passes. Holding a particular NFT may provide access to private communities, online content, events, products or services. Because ownership can be checked directly on the blockchain, applications can verify access without requiring a traditional username and password.

### Tickets and Certificates

NFTs can represent tickets, certificates, licenses or other credentials. For example, an NFT could be used to prove attendance at an event, completion of a course (sometimes referred to as a Proof of Knowledge, or POK) or ownership of a particular membership. However, public blockchains are visible to everyone, so projects need to consider privacy before using NFTs for personal credentials.

### Domain Names and Digital Identities

Blockchain naming systems such as ENS can use NFTs to represent domain names. For example, an NFT may give its owner control over a human-readable blockchain name. The owner can transfer, sell or configure the name through their wallet.

### Financial Positions

NFTs can also represent financial positions. Some decentralized finance protocols use NFTs to represent positions that have unique parameters, such as liquidity ranges, deposited assets or expiration dates. In this case, the NFT is not primarily a collectible. It acts as a transferable record of a specific financial position.

### Tokenized Physical Assets

NFTs can be used to represent claims on physical items such as collectibles, luxury goods, event tickets or property records. However, putting a token on a blockchain does not automatically guarantee ownership of the physical item. The connection between the NFT and the real-world asset still depends on contracts, trusted organizations or legal agreements.

## NFT Standards

An NFT standard is a set of rules that defines how an NFT smart contract should behave. Standards make it easier for wallets, marketplaces and other applications to support NFTs created by many different projects. The most common NFT standards on Ethereum and other EVM chains are ERC721 and ERC1155.

### ERC721

ERC721 is the most widely recognized NFT standard. Each ERC721 token has its own unique token ID. This makes the standard well suited for individual assets such as collectibles, artworks, domain names and unique game items. ERC721 is commonly used for profile picture (PFP) collections, where each NFT represents a distinct item with its own traits and identity.

### ERC1155

ERC1155 allows one smart contract to manage multiple types of tokens. It can support unique NFTs, multiple copies of the same item and even fungible tokens within a single contract. This makes ERC1155 useful for games, digital collectibles and applications that need to manage many different asset types efficiently. For example, it can be used in trading card games (TCGs), where multiple copies of the same card or item may exist.

### Older and Custom NFT Contracts

Not every NFT follows ERC721 or ERC1155. Some early NFT projects were created before these standards became widely adopted. Others use custom smart contracts with their own rules and functionality. For example, CryptoPunks is an early NFT project that originally used a custom contract before ERC721 became the standard. As a result, older or unusual NFTs may not work with every wallet, marketplace or application.

## NFT Approvals

NFT approvals allow another address or smart contract to transfer NFTs from your wallet. There are two common types of NFT approvals:

- Approval for one specific NFT
- Approval for all NFTs from a particular collection

Collection-wide approvals are often used by marketplaces because they allow users to list and sell multiple NFTs without approving each one separately. These approvals are convenient, but they can also create risk. If you approve a malicious or compromised contract, it may be able to transfer the NFTs covered by that approval. An NFT approval remains active until it is revoked.

## How Are NFTs Bought and Sold?

NFTs can be transferred directly between wallets or traded through NFT marketplaces.

A marketplace allows buyers and sellers to discover NFTs, make offers and complete trades. Some marketplaces support many different collections, while others focus on a particular blockchain, community or type of asset. Marketplace aggregators can compare listings from multiple marketplaces and help users find available NFTs across different platforms.

When trading NFTs, users should verify:

- The NFT collection and contract address
- The marketplace or application they are using
- The transaction or signature they are being asked to approve
- Any royalties, marketplace fees or network fees
- Whether the NFT includes the rights or utility they expect

NFT names and images can be copied easily, so the visual appearance of an NFT alone does not prove that it belongs to the official collection.

## Why Did a Random NFT Appear in My Wallet?

Anyone can send an NFT to a public wallet address. This means an unfamiliar NFT may appear in your wallet even if you did not buy or request it. Some unsolicited NFTs are harmless spam, often distributed via QR codes or vouchers. Others are designed to lead users to malicious websites or trick them into signing dangerous transactions.

A random NFT appearing in your wallet does not automatically mean that your wallet has been compromised. However, you should avoid following links in its name, image or description and avoid interacting with unknown contracts. Wallet applications may hide suspicious NFTs automatically, but the token can still remain associated with your address on the blockchain.

## NFT Risks

NFTs can have practical uses, but they also come with risks. Common NFT risks include:

- Fake collections impersonating legitimate projects
- Malicious minting websites
- Dangerous signatures and approvals
- Smart contract bugs
- Stolen or copied artwork
- Metadata or images becoming unavailable
- Projects removing promised utility
- Projects being abandoned
- Low liquidity
- Extreme price volatility
- Misleading claims about ownership or intellectual property rights
- Compromised marketplaces or project accounts

NFT ownership is easy to verify on a blockchain, but the value, authenticity and rights associated with an NFT may still depend on external information.

## FAQ

::::faq

:::faq-item{question="What is an NFT?"}
An NFT is a unique digital token that exists on a blockchain. NFTs can represent digital art, collectibles, game items, memberships, domain names, tickets, financial positions and other distinct assets.
:::


:::faq-item{question="What does NFT stand for?"}
NFT stands for Non-Fungible Token. Non-fungible means that the token is individually identifiable and is not necessarily interchangeable with another token of the same type.
:::

:::faq-item{question="What is the difference between a token and an NFT?"}
Fungible tokens are interchangeable. For example, one USDC has the same basic function as another USDC. NFTs are individually identifiable and can have different properties, ownership histories or values.
:::

:::faq-item{question="Are NFTs stored on the blockchain?"}
The NFT token and its ownership record are stored on the blockchain. However, the associated image, video or metadata may be stored on-chain, on a decentralized storage network or on a centralized server.
:::

:::faq-item{question="Does owning an NFT mean I own the image?"}
Not necessarily. Holding an NFT means your address can prove ownership of the blockchain token. Copyright and commercial rights depend on the terms provided by the creator or project.
:::

:::faq-item{question="Can anyone create an NFT?"}
Yes. Anyone can create an NFT by deploying or using an NFT smart contract on a supported blockchain. This also means that not every NFT is legitimate, valuable or created by the person who owns the associated artwork.
:::

:::faq-item{question="Can two NFTs have the same image?"}
Yes. Different NFTs can point to the same image or use identical media. Their token IDs and contract addresses may still be different.
:::

:::faq-item{question="What is an ERC721 NFT?"}
ERC721 is a common Ethereum standard for NFTs. Each ERC721 token has its own unique token ID and can represent an individually identifiable asset.
:::

:::faq-item{question="What is the difference between ERC721 and ERC1155?"}
ERC721 is commonly used for one-of-one or individually unique NFTs, like profile picture (PFP) projects where each token is different. ERC1155 is often used for items that can have multiple copies, like trading card game (TCG) items or in-game assets, where many users can own the same item.
:::

:::faq-item{question="Why do NFTs need approvals?"}
NFT approvals allow marketplaces and other smart contracts to transfer NFTs from your wallet on your behalf. For example, when an NFT is sold through a marketplace, its contract may use an existing approval to transfer the NFT to the buyer once the sale is completed.

An approval can apply to one specific NFT or every NFT from a collection. Because approved contracts may have broad transfer permissions, you should only approve applications you trust.
:::

:::faq-item{question="Can an NFT drain my wallet?"}
An NFT simply appearing in your wallet usually cannot drain it by itself. The main risk comes from interacting with malicious websites or contracts and signing dangerous transactions or approvals, so it is best never to interact with unknown tokens in your wallet.
:::

:::faq-item{question="Why did a random NFT appear in my wallet?"}
Anyone can send an NFT to a public wallet address. Random NFTs may be harmless spam or part of a scam designed to lead you to a malicious website or contract, so as a rule of thumb you should never interact with unknown tokens.
:::

:::faq-item{question="Can NFTs be deleted?"}
Some NFT contracts include a burn function that permanently marks the token as destroyed. In other cases, users send NFTs to an inaccessible burn address. Either way, the historical blockchain record usually remains visible. Separately, the image or media linked to an NFT may become unavailable if it is hosted off-chain and the hosting service stops working, which can make the NFT appear “broken” even though the token itself still exists on the blockchain.
:::

:::faq-item{question="Are NFTs only digital art?"}
No. Digital art and collectibles are well-known NFT use cases, but NFTs can also represent memberships, tickets, domain names, game items, credentials, financial positions and claims on physical assets.
:::

:::faq-item{question="Are NFTs still useful if they have no resale value?"}
An NFT can still have utility even if it has no resale value. It may provide access, prove ownership, represent an account or position, or function inside an application. Its usefulness depends on what the NFT represents and whether the supporting project or service continues to operate.
:::

:::faq-item{question="Can someone copy my NFT?"}
Someone can copy or save the image associated with an NFT, but that does not give them ownership of the original blockchain token. However, copied images can also be used to create fake collections, so the image alone is not enough to verify whether an NFT is authentic. You should check its contract address and ownership history.
:::

::::
