---
title: 'Monthly Update: October 2024'
description: We promised a big update in October, and we're happy to share that we've delivered on that promise. Batch revoking is something that many of our users have been asking for, and now it is finally here.
date: 2024-10-31
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# Monthly Update: October 2024

We promised a big update in October, and we're happy to share that we've delivered on that promise. Batch revoking is something that many of our users have been asking for, and while it is technically not possible to combine multiple revokals into a single transaction, we have made it as easy as possible to revoke multiple approvals at once.

## Batch Revoking

If you're a big crypto user, then you might end up with dozens of approvals in your crypto wallet. We understand that it can be tedious to revoke them one by one, and our users have been asking for a way to revoke multiple approvals at once. Our answer has always been that it's not possible to bundle multiple revokals into a single transaction, and that continues to be the case.

::img{src="/assets/images/blog/2024/monthly-update-october/batch-revoke.png" alt="Batch Revoke" width="2000" height="1000"}

But that does not mean that we cannot make the process easier. We have added a new feature that allows you to select all the approvals you want to revoke, and then queue them up for revocation. Once you click the "Revoke" button, we send the transactions to your wallet in a single click. From there, you still need to confirm the transactions in your wallet, but the process is a lot faster and easier.

## Ledger Live Integration

At Revoke.cash we always recommend using a hardware wallet for the best security. And while the coldest of vaults probably should not ever have any token approvals in the first place, it is still a good idea to use a hardware wallet for your normal accounts as well. So when managing your token approvals on Ledger hardware wallets, you can now use Revoke.cash directly from Ledger Live.

::img{src="/assets/images/blog/2024/monthly-update-october/ledger-live.png" alt="Ledger Live" width="3448" height="2156"}

The Ledger team has been very helpful in integrating Revoke.cash into Ledger Live, so we are very excited to see our application available right in the Ledger Live app.

## Improved Permit2 Support

As you might now, [Permit2](/learn/approvals/what-is-permit2) is a way of giving token approvals using offchain signatures. The original Permit2 contracts were developed by Uniswap and we've supported them for a long time. But we've noticed that several other projects have developed their own Permit2-compatible contracts, which we now also support.

## New Exploit

This month, there was another big exploit, with over $50m stolen from users of Radiant Capital. This has been a particularly brutal exploit, because we still see many users getting rekt, even weeks after the exploit. So if you've ever used their product, make sure to revoke your token approvals to stay safe.

- [Radiant Capital Hack](/exploits/radiant)

## New Supported Networks

This month a lot of new high-profile networks launched and we made sure to add them to our ever-growing list of 100+ supported networks.

New Mainnets:

- [ApeChain](/token-approval-checker/apechain)
- [World Chain](/token-approval-checker/world-chain)
- [Chiliz](/token-approval-checker/chiliz)
- [Morph](/token-approval-checker/morph)
- [Zircuit](/token-approval-checker/zircuit)
