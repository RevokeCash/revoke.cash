---
title: How to Revoke Token Approvals and Permissions
sidebarTitle: How to Revoke Token Approvals
description: Revoking token approvals is essential to maintaining proper wallet hygiene. Learn how to revoke token approvals using Revoke.cash and other tools.
translator: <Your Name Here (or remove)>
---

# How to Revoke Token Approvals and Permissions

In [What Are Token Approvals?](/learn/approvals/what-are-token-approvals), we learned that token approvals are a way for smart contracts to interact with your tokens. While this is a useful feature, it can also be dangerous. This is why it's important to revoke token approvals when you no longer need them, or when you suspect you signed a malicious approval on a phishing website.

## The Importance of Revoking Token Approvals

If you're a big (or small) crypto user, you can usually amass quite a big list of token approvals. And if you don't revoke them, the approvals stay active indefinitely. It has happened multiple times in the past that established projects get hacked, and if you haven't revoked your approvals, you may be vulnerable even years after you last interacted with the project.

At the same time, the world of crypto is rife with scams and phishing, and it's easy to accidentally sign a malicious approval on a phishing website. Often when this happens, the scammer will drain your tokens shortly after you sign the approval, but if you revoke it in time, you can prevent this from happening. Even if you're not in time to stop the scammer, you should still revoke the approval, as it could be used again in the future.

## Revoke Token Approvals Using Revoke.cash

Revoke.cash is the biggest and most popular tool for revoking token approvals. It works with all big wallets and supports over 60+ different networks.

To revoke token approvals, you can enter your wallet address (or ENS name / other alias) in the search bar or connect your wallet, as can be seen at (1) in the image below. From there you can select the network for which you want to revoke approvals (2).

After the loading is finished, you will see a list of all the token approvals you have on that network. You can sort this list (3), apply filters (4) or search by the approved spender address (5). If you suspect that you signed a malicious approval, it is recommended to sort by "Newest to Oldest" so that you see the most recently signed approvals first.

After applying these options, you can find the approval you want to revoke and click the _Revoke_ button (7). Alternatively, it's also possible to update the approval to a different amount by clicking the pencil icon next to the approved amount (6). This can be useful if you want to reduce your risk, but still need the approval in the future.

![Revoke.cash](/assets/images/learn/approvals/how-to-revoke-token-approvals/revoke-cash.png)

If you prefer learning through video content, our friend [WiiMee](https://twitter.com/Wii_Mee) has created an excellent video tutorial on how to use Revoke.cash. If you want to read more from other sources, [Bankless Academy](https://app.banklessacademy.com/lessons/managing-token-allowances) has also written a great article on the topic.

::youtube-video{title="How To Revoke Token Approvals on Revoke.cash by WiiMee" id="XfojTY30d8M"}

## Revoke Token Approvals Using Etherscan

Another popular tool for revoking token approvals is Etherscan and other explorers like Polygonscan. While not as user-friendly as Revoke.cash, they are still a good option if you're already familiar with the block explorer and don't want to use another tool.

To revoke token approvals on Etherscan you have to navigate to the _Token Approvals_ page, which can be accessed through the _More_ menu in the top navigation bar. On that page you can enter your wallet address, as can be seen at (1) in the image below. You can then select the token type (ERC20, ERC721, ERC1155) that you want to check approvals for (2).

After loading you will see a list of all token approvals for your selected token type. Make sure to flip the switch for _Show all approvals_ (3) to make sure you see all your approvals. Finally you can find the approval you want to revoke and click the _Revoke_ button (4).

If you want to revoke token approvals on other chains like BNB Chain or Polygon, you can use the same process, but you have to navigate to the respective block explorer for that chain, like BscScan or Polygonscan.

![Etherscan](/assets/images/learn/approvals/how-to-revoke-token-approvals/etherscan.png)

Again our friend [WiiMee](https://twitter.com/Wii_Mee) has created a video tutorial on how to use Etherscan to revoke token approvals if you prefer learning by video.

::youtube-video{title="How To Revoke Token Approvals on Etherscan by WiiMee" id="RJ2ufhFnK1U"}
