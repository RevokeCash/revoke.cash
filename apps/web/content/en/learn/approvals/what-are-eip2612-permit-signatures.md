---
title: What Are EIP2612 Permit Signatures?
sidebarTitle: What Are Permit Signatures?
description: Permit Signatures are a way to grant approvals through gasless signatures. This has some important benefits, but also some drawbacks.
translator: <Your Name Here (or remove)>
---

# What Are EIP2612 Permit Signatures?

As we discussed in _[What Are Token Approvals?](/learn/approvals/what-are-token-approvals)_, you can grant token approvals using the `approve()` function on a token's smart contract. This has to be done using an onchain transaction, which incurs a gas fee any time an approval is granted.

Because of the gas fees involved, many applications have opted to ask for unlimited approvals, which means that you only need to pay the approval's gas fee once. This can be a security risk, since the application keeps this unlimited access indefinitely. Ideally you would only grant a limited approval that covers the specific amount of tokens needed for a particular transaction. But then you would need to pay the gas fee for each approval.

[EIP2612](https://eips.ethereum.org/EIPS/eip-2612) attempts to solve this problem by allowing you to sign an approval message offchain. That way you don't need to send an onchain transaction to grant an approval, and you can grant a limited approval without paying a gas fee.

## How do Permit Signatures Work?

EIP2612 is an extension of the ERC20 token standard, which means that ERC20 tokens can choose to implement this additional functionality, but most tokens do not support it. Permit signatures are based on the [EIP712](https://eips.ethereum.org/EIPS/eip-712) standard, which defines a standardised way to sign structured data. The data that you have to sign for Permit signatures contains the same information as for granting onchain approvals: the authorised spender address and amount of tokens.

::img{src="/assets/images/learn/approvals/what-are-eip2612-permit-signatures/permit.png" alt="Permit Approve USDC on Etherscan" width="1560" height="1449"}

Then this data and the corresponding signature can be passed into the token's `permit()` function, which checks that the signature approval and "activates" the approval onchain, after which it is the same as a regular onchain approval. While this kind of signature needs to be "activated" onchain, the onchain activation can be combined with the transaction for which you need the approval, so you don't need to send a separate approval transaction.

## Benefits of Permit Signatures

As mentioned above, the main problem that Permit signatures solve is that you can grant approvals without needing to send a separate approval transaction. This offers two important benefits:

- Reduced friction for users, since they don't need to pay a gas fee or wait for a transaction to be mined.
- Reduced security risk, since it is viable to grant limited approvals that only cover the necessary amount of tokens for specific transactions.

## Drawbacks of Permit Signatures

While Permit signatures offer some important benefits, they also have some drawbacks. One drawback is that they are not supported by most tokens, so you can't rely on them being available. Because of their limited support in ERC20 tokens, they are also not supported by many smart contract applications. For smart contracts to support Permit signatures, they need to specifically implement this support, which adds additional friction for developers.

::img{src="/assets/images/learn/approvals/what-are-eip2612-permit-signatures/permit-request.png" alt="Permit Approve USDC MetaMask Popup" width="1110" height="580"}

Because Permit signatures are offchain signatures, they are also often used by scammers to trick users into granting approvals. Many wallets, such as MetaMask, now display a warning when you sign an onchain approval, but for Permit signatures, these kinds of warnings are absent. So it may look like you're simply signing into a website, but you're actually granting an approval.

## Cancelling Permit Signatures

If you suspect you may have signed a Permit signature on a scam website, you may be able to _cancel_ or _invalidate_ the signature before it gets activated by the scammer. This is generally very hard to do though, since scammers will often try to activate the approval as soon as possible. Once it is activated, it can be revoked from your approvals dashboard, just like regular approvals.

If you want to try cancelling a potential scam signature, you can do so on the _Signatures_ tab on your account page.

::img{src="/assets/images/learn/approvals/what-are-eip2612-permit-signatures/permit-signatures.png" alt="Permit Signatures on Revoke.cash" width="2424" height="720"}

One important thing to note once again is that Permit signatures are offchain, which means that a platform like Revoke.cash can never determine which signatures you've signed. So everything you see on the _Signatures_ tab on Revoke.cash is only a _potential_ signature, and you should only attempt to cancel them if you are very sure that you signed a scam Permit signature. Cancelling signatures needlessly is not dangerous, but it is a waste of gas.
