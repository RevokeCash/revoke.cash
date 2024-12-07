---
title: 如何撤销代币批准和权限
sidebarTitle: 如何撤销代币批准
description: 撤销代币批准对于保持适当的钱包安全至关重要。了解如何使用 Revoke.cash 和其他工具撤销代币批准。
translator: KKontheway | https://x.com/zzzkkk12355
---

# 如何撤消代币批准和权限

在[什么是代币批准?](/learn/approvals/what-are-token-approvals)，我们了解到代币批准是智能合约与代币交互的一种方式。虽然这是一项有用的功能，但也可能很危险。这就是为什么当您不再需要令牌批准时，或者当您怀疑自己在钓鱼网站上签署了恶意批准时，撤销令牌批准很重要。

## 撤销代币批准的重要性

如果你是一个大（或小）的Crypto用户，你通常可以积累相当多的代币批准清单。而且，如果你不撤销它们，批准将无限期地保持有效。过去曾多次发生过已建立的项目遭到黑客入侵的情况，如果你没有撤销批准，即使在你上次与该项目互动数年之后，你也可能处于脆弱状态。

同时，加密世界充斥着诈骗和网络钓鱼，很容易在钓鱼网站上意外签署恶意批准。通常，当这种情况发生时，诈骗者会在您签署批准后不久耗尽您的代币，但是如果您及时将其撤销，则可以防止这种情况发生。即使你没有及时阻止诈骗者，你仍然应该撤销批准，因为将来可能会再次使用它。

## 使用 Revoke.cash 撤销代币批准

Revoke.cash是撤销代币批准的最大、最受欢迎的工具。它适用于所有大型钱包，并支持100多个不同的网络。

要撤销代币批准，您可以在搜索栏中输入您的钱包地址（或ENS名称/其他别名）或连接您的钱包，如下图中的（1）所示。从那里您可以选择要撤消批准的网络 (2)。

加载完成后，您将看到您在该网络上获得的所有代币批准的列表。您可以对该列表进行排序（3），应用筛选条件（4）或按批准的支出者地址（5）进行搜索。如果您怀疑自己签署了恶意批准，建议按 “最新到最旧” 排序，这样您就可以首先看到最近签署的批准。

应用这些选项后，您可以找到要撤销的批准，然后单击*Revoke*按钮 (7)。或者，也可以通过点击批准金额 (6) 旁边的铅笔图标将批准更新为不同的金额。如果您想降低风险，但将来仍需要批准，这可能很有用。

::img{src="/assets/images/learn/approvals/how-to-revoke-token-approvals/revoke-cash.png" alt="Revoke.cash" width="2560" height="1414"}

如果你更喜欢通过视频内容学习，我们的朋友[WiiMee](https://twitter.com/Wii_Mee)制作了一篇关于如何使用Revoke.cash的精彩视频教程。如果你想从其他来源阅读更多内容，[Bankless Academy](https://app.banklessacademy.com/lessons/managing-token-allowances)也写了一篇关于这个话题的好文章。

::youtube-video{title="How To Revoke Token Approvals on Revoke.cash by WiiMee" id="XfojTY30d8M"}

## 使用 Etherscan 撤销令牌批准

撤销代币批准的另一个常用工具是Etherscan和其他浏览器，例如Polygonscan。虽然不像Revoke.cash那样用户友好，但如果你已经熟悉区块浏览器并且不想使用其他工具，它们仍然是一个不错的选择。

要撤消Etherscan上的令牌批准，您必须导航到*令牌批准*页面，可通过顶部导航栏中的*更多*菜单访问该页面。在该页面上，您可以输入您的钱包地址，如下图中的（1）所示。然后，你可以选择要检查批准情况的代币类型（ERC20、ERC721、ERC1155）（2）。

加载后，您将看到所选代币类型的所有代币批准列表。请务必拨动*Show all approvals* (3) 的开关，以确保您看到所有批准。最后，您可以找到要撤销的批准，然后单击*Revoke*按钮 (4)。

如果你想撤销对其他链（例如BNB Chain或Polygon）的代币批准，你可以使用相同的流程，但你必须导航到该链的相应区块浏览器，例如BscScan或Polygonscan。

::img{src="/assets/images/learn/approvals/how-to-revoke-token-approvals/etherscan.png" alt="Etherscan" width="2560" height="1414"}

我们的朋友 [WiiMee](https://twitter.com/Wii_Mee)再次创建了一个视频教程，介绍如果你更喜欢通过视频学习，如何使用Etherscan撤销代币批准。

::youtube-video{title="How To Revoke Token Approvals on Etherscan by WiiMee" id="RJ2ufhFnK1U"}
