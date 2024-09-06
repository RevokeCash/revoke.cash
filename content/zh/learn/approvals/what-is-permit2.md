---
title: 什么是Permit2?
description: Permit2是由Uniswap团队开发的一个系统，用于对每个令牌进行无Gas费审批。这项措施带来好处的同时也带来了风险。
translator: KKontheway | https://x.com/zzzkkk12355
---

# 什么是Permit2？

在 _[什么是EIP2612签名](/learn/approvals/what-are-eip2612-permit-signatures)_ 中，我们讨论了Permit签名是如何通过无Gas Fee签名授予批准的，但我们也提到，对这些 Permit 签名的支持必须由Token本身实现，而大多数Token并非如此。 Permit2是Uniswap团队为了解决这个问题而开发的系统。

## Permit2是如何工作的？

Permit2是一个智能合约，需要用户给予无限制的批准。 Permit2 合约获得批准后，可用于向其他智能合约授予子批准。这可以通过 `Permit2.approve()` 函数来完成，该函数的工作方式与 ERC20 代币上的 `approve()` 函数类似。但也可以通过 `Permit2.permit()` 函数来完成，其工作原理类似于 EIP2612 `permit()` 函数。

除了向不支持 Permit 签名的令牌添加对 Permit 签名的支持之外，Permit2 还添加了其他附加功能。最重要的是，它为使用 Permit2 进行的所有批准添加了过期时间。因此，您不需要无限期地批准合同，而是可以让批准自动过期。

## Permit2的好处

Permit2 与原始 EIP2612 Permit 签名具有许多相同的优点：用户的手续费消耗更少，因为他们不需要发送单独的批准交易，并且潜在的安全风险更少，因为应用程序在使用 Permit 时不需要请求无限的批准或允许2个签名。

最重要的是，Permit2 解决了 EIP2612 Permit 签名的主要缺点之一：大多数Token不支持EIP2612 Permit。 Permit2 通过为每个Token启用无Gas的Permit 签名来解决这个问题。

Permit2 的另一项好处是它还增加了批准的过期时间。这减少了用户的手续费损失，因为他们不需要手动撤销所有批准。它还降低了安全风险，因为可以被黑客利用的拖延批准将会减少。

## Permit2的的缺点和风险

虽然 Permit2 确实有重要的好处，但值得注意的是，与常规批准或 EIP2612 许可证签名相比，它还引入了一些新的安全风险。

![Permit2 Batch MetaMask Popup](/assets/images/learn/approvals/what-is-permit2/permit-batch.png)

Permit2 系统非常灵活，允许同时批准多个代币。由于这种灵活性，用户很难理解他们正在批准什么。钓鱼网站可能会滥用这一点来诱骗用户授予他们不理解的批准。

除了给用户带来的这些额外风险之外，还给应用程序开发人员带来了额外的工作。与使用常规批准甚至 EIP2612 Permit 签名相比，与 Permit2 集成需要做更多的工作。 Permit2 确实支持每个Token，这一缺点得到了缓解，因此与 EIP2612 Permit 签名相比，这项工作可能更容易证明其合理性。

## 撤销Permit2批准

在谈论 Permit2 批准时，有两件事需要考虑。首先是您对 Permit2 合同本身的定期批准。需要此批准才能允许 Permit2 合同代表您授予 Permit2 批准。建议您在不再使用时撤销此批准。特别是考虑到我们上面讨论的额外的钓鱼风险。

第二件事要考虑的是 Permit2 合同代表您授予的实际 Permit2 批准。通常，这些批准的过期时间应该不会太远，因此您可以考虑让它们自动过期。如果过期时间太长，您仍然可以使用 Revoke.cash 手动撤销或更新批准。

![Permit2 Approvals on Revoke.cash](/assets/images/learn/approvals/what-is-permit2/permit2-approvals.png)
