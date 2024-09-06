---
title: What Is Address Poisoning?
sidebarTitle: 'Common Scam: Address Poisoning'
description: Address poisoning is a scam that tries to trick you into sending money to the wrong address. Learn how address poisoning works and how you can stay safe from it.
translator: <Your Name Here (or remove)>
---

# What Is Address Poisoning?

Address poisoning is a type of scam that involves token transfers to addresses that looks similar to ones that you've interacted with in the past. The goal of address poisoning is to trick you into sending tokens to the wrong address if you're not careful. In this article we explore how address poisoning works and how you can stay safe from it.

## Different Types of Address Poisoning

There are two main types of address poisoning attacks: **fake tokens** and **zero value transfers**. In both cases the goal is the same: to make it seem like you sent tokens to a certain address when you actually didn't.

![Address Poisoning Transaction History](/assets/images/learn/security/what-is-address-poisoning/transaction-history.jpg)

Many wallets and block explorers will show you the token transfers that you've sent and received in the past. This is a useful feature, and many users use this feature to copy and paste addresses when they want to send tokens to someone. But if you're not careful, you might accidentally copy and paste the wrong address due to address poisoning.

### Fake Tokens

With the _fake tokens_ method, the scammer creates a fake token contract with the same name as apopular token, such as USDC or USDT. And because the scammers create their own _fake_ token contracts, they can program these tokens to make it look like you sent tokens to a certain address, even though you didn't.

Then they monitor the transfers of the real token, and when they see a transfer of these tokens, they send a transfer of their _fake_ tokens to the same address that the initial transfer was sent from on your behalf. This makes it look like you sent tokens to a certain address, even though you didn't.

Then, when you check your wallet history or a block explorer, you might see the fake token transfer and confuse it for the actual token transfer that you made. So when you copy-paste the address because you want to repeat the transfer, you might accidentally send the real tokens to the scammer's address.

### Zero Value Transfers

While the _fake tokens_ method can be very dangerous, you can usually spot it since the fake tokens usually don't have the same token icon on block explorers or wallets. But the _zero value transfers_ method is much sneakier because they use the _real_ token contract to make it look like you sent tokens to a certain address.

Similar to the _fake tokens_ method, the scammer monitors the transfers of certain tokens, such as USDT or USDC. But instead of creating a fake token contract, they use the `transferFrom` functionality of the _real_ token contract to send a zero value from _your_ wallet address to a different address that looks similar to the original address, but actually belongs to the scammer.

![Zero Value Transfer Address Poisoning](/assets/images/learn/security/what-is-address-poisoning/zero-transfer.jpg)

This variant is dangerous because it uses the _real_ token contract and it appears to send those tokens from _your_ address. The only difference is that the recipient address is different and that the value of the transfer is zero. Now you might rightfully be asking yourself: _How is it even possible that the scammer can make these zero value transfers on my behalf?_

![Zero Value Allowances](/assets/images/learn/security/what-is-address-poisoning/zero-transfer-allowances.jpg)

The answer here is that they are using the token's `transferFrom` functionality. Generally, this function is used to allow smart contracts to transfer tokens on behalf of the user with token approvals. This is a common pattern in DeFi and you can read more about it in _[What Are Token Approvals?](/learn/approvals/what-are-token-approvals)_.

Even though you did not give any token approvals to the scammer, they can still use this function to send zero value transfers from your address. This is because the `transferFrom` function only checks that the transfer amount is less than or equal to the approved amount. So if the amount is zero, then the transfer will always succeed, even if the approved amount is also zero.

## Staying Safe from Address Poisoning

The main way these scams happen is when you copy and paste an address from a wallet history or a block explorer. That is why our recommendation is to never use your wallet history or block explorer as a source of truth for finding addresses to send tokens to. So if you're depositing funds into a centralised exchange, copy the deposit address from their website every time. Or if you're sending money to a friend, ask them for their address.

We also recommend to always double check the address that you're sending tokens to, especially if you do insist on copy-pasting from your wallet history or block explorer. It is commonly recommended to verify the first and last 4 characters of the address, but this is actually not enough. Scammers can create addresses that have the same first and last 4 characters as the address that you're trying to send tokens to. So we highly recommend to always double check more than just the first and last 4 characters.

As long as you don't use your wallet history or block explorer to copy addresses from and you always double check the address that you're sending tokens to, then you should be safe from address poisoning.
