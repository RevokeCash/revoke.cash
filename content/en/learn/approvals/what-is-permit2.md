---
title: What Is Permit2?
description: Permit2 is a system that was developed by the Uniswap team to enable gasless approvals for every token. Learn more about Permit2.
translator: <Your Name Here (or remove)>
---

# What Is Permit2?

In _[What Are EIP2612 Permit Signatures?](/learn/approvals/what-are-token-approvals)_ we discussed how Permit signatures are a way to grant approvals through gasless signatures. But we also mentioned that support for these Permit signatures has to be implemented by the token itself, which is not the case for most tokens. Permit2 is a system that was developed by the Uniswap team to solve this problem.

## How Does Permit2 Work?

Permit2 is a smart contract that users need to give an unlimited approval to. After approving the Permit2 contract, it can be used to grant sub-approvals to other smart contracts. This can be done through a `Permit2.approve()` function, which works in a similar way as the `approve()` function on ERC20 tokens. But it can also be done through a `Permit2.permit()` function, which works like the EIP2612 `permit()` function.

Besides adding support for Permit signatures to tokens that don't support them, Permit2 also adds other additional functionality. Most importantly it adds an expiration time to all approvals made using Permit2.So you don't need to approve a contract indefinitely, but instead can have the approve expire automatically.

## Benefits of Permit2

Permit2 has many of the same benefits as the original EIP2612 Permit signatures: less friction for users because they don't need to send a separate approval transaction, _and_ potentially less security risk because there is no need for applications to request unlimited approvals when using Permit or Permit2 signatures.

On top of that, Permit2 solves one of the main drawbacks of EIP2612 Permit signatures: the fact that they are not supported by most tokens. Permit2 solves this issue by enabling gasless Permit signatures for every token.

One additional benefit of Permit2 is that it also adds an expiration time to approvals. This reduces friction for users because they don't need to manually revoke all approvals. It also reduces security risk, since there will be fewer lingering approvals that can be exploited by hackers.

## Drawbacks and Risks of Permit2

While Permit2 does have important benefits it is also important to note that it also introduces some new security risks compared to regular approvals or EIP2612 Permit signatures.

![Permit2 Batch MetaMask Popup](/assets/images/learn/approvals/what-is-permit2/permit-batch.png)

The Permit2 system is very flexible and allows for granting approvals for multiple tokens at once, to multiple smart contracts at once. Because of this flexibility, it is harder for users to understand what they are approving. This can be abused by phishing websites to trick users into granting approvals that they don't understand.

Besides these added risks for users, there is also added friction for application developers. It is more work to integrate with Permit2 than to use regular approvals or even EIP2612 Permit signatures. This drawback is mitigated by the fact that Permit2 does support every token, so the effort may be easier to justify than for EIP2612 Permit signatures.

## Revoking Permit2 Approvals

When talking about Permit2 Approvals, there are two things to consider. First is the regular approval that you give to the Permit2 contract itself. This approval is needed to allow the Permit2 contract to grant _Permit2 approvals_ on your behalf. It is recommended to revoke this approval so when you are not using it anymore. Especially considering the added phishing risk that we discussed above.

The second thing to consider is the actual _Permit2 approvals_ that the Permit2 contract grants on your behalf. Oftentimes these approvals will have an expiration time that should not be too far in the future, so you can consider letting them expire automatically. If the expiration is too far in the future, you can still revoke or update the approval manually using Revoke.cash.

![Permit2 Approvals on Revoke.cash](/assets/images/learn/approvals/what-is-permit2/permit2-approvals.png)
