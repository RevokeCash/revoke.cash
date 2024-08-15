---
title: What to do when you’ve been scammed
description:
translator: <Your Name Here (or remove)>
---

# What to do when you’ve been scammed

This is probably one of the most frequent questions we get:

“I’ve just been scammed, what can I do about it?”

First, we need to identify the root cause that led to you becoming a victim of a crypto scam.
Since not everything is black and white, there are a few questions that need to be addressed to find out what happened.

The main question you want to ask yourself is:

## What has been stolen?

Is it one specific token that has been stolen?
Have several tokens been stolen?
Have tokens on different blockchains been stolen?
Have tokens from different wallet addresses been stolen?

Depending on the answers to the above questions, we can narrow down the cause of your loss.
We created this flowchart to gain a better understanding of possibilities and pathways.

**insert _flowchart_**

### The “they took everything of value” option:

If several tokens have been stolen out of your wallet, and additionally they were taken across multiple blockchains and/or multiple wallet addresses - it’s pretty safe to say that your seed phrase and/or private keys have been compromised. Additionally, if the native token of the blockchain (for example ETH, MATIC..) gets swept immediately you try to "top up", you can be certain that your seed phrase has been exposed.
This means someone has gotten full access to your account, and they just took everything that had value from you.

People often reach out to us, saying that they weren’t even on their PC while the theft happened.
Most likely, it's because your seed phrase was compromised.

These compromises can come in various forms.
One of the most common we see is through malware - for example, you downloaded a “conferencing software” or a “game launcher” that was offered to you in a social media interaction.
If you then proceed to install the “software,” the so-called crypto stealers will do their work and find any instances of wallet extensions such as MetaMask, Rabby, Coinbase, etc., on your computer - or just scan your RAM for any crypto-related applications and steal the data.
Malware plus relying on a single software wallet, to this date, is one of the most common reasons people get their keys compromised.

Another way of getting compromised could be a digital copy of your seed phrase stored somewhere in a cloud service like Google Drive, Dropbox or iCloud and that account gets compromised.

In case your seed phrase / private keys have been exposed, there is nothing you can do to "re-secure" your wallet or regain total control over it.
The affected wallet addresses need to be abandoned.
Note: A sweeper bot is often attached to a compromised wallet address, which will steal any tokens that end up in your wallet in the future, too. There are ways to front-run a sweeper bot for instances like claiming an upcoming airdrop or unstaking some tokens to save them - but this is advanced territory. If you are interested in learning more, you can read about flash-bots [here](https://docs.flashbots.net).

###### What can be done?

- Run a malware check
- Create a completly new wallet
- Try to rescue remaining (valuable) assets

###### How to prevent?

- Use a hardware wallet to be safe from Malware (at least those made for operating systems)
- Don't use digital seed phrase backups

### The “they took multiple approved tokens” option:

What usually happens in these cases is that a user visits a phishing website without realizing.
Users are then prompted with requests for gasless signatures to marketplaces or services like OpenSea, Blur or Uniswap.

These phishing attacks target wallets that have _several_ active approvals for popular smart contracts, such as OpenSea or the Permit2 contract from Uniswap. The marketplace signature phishing attack is a "one and done" event, unless you signed multiple requests. You may continue to use your wallet at your own risk.

By signing the signature request, believing that they are visiting a legitimate website, the user creates an authorization for the attacker's wallet to "buy" all of the already approved user assets (to a certain smart contract) for no countervalue.
Affected users can track how their assets were stolen in the Blockchain Explorer.
If this method was used, no direct transfers should appear, but functions such as "MatchOrders" or "BulkExecute".

Due to the nature of this attack, the damage is usually limited to a single wallet, a single blockchain and pre-approved tokens or collections.
If there are multiple wallets and blockchains involved, please read the above “they took everything” option.

It is possible and endorsed to revoke the approvals for unused smart contracts via revoke.cash.

Please note: Revoking approvals does not help in restoring tokens that have already been stolen - there is no way to do that. Revoking permission only serves the purpose, to ensure that this does not happen again in the future via this given approval.

###### What can be done?

- Revoke token approvals, especially unused ones
- If fast enough, cancel marketplace signatures

###### How to prevent?

- Double check URLs
- Use bookmarks
- Use security browser extensions

### The “they took one kind of token” option:

In these cases the user is tricked into signing either a direct transfer of a certain asset, or signing an approval transaction request.

If the blockexplorer shows the transfer function, and no additional approvals on Revoke.cash - you most likely signed a direct transfer of the asset in doubt. Malicious transfers often come disguised as named functions, such as "Security Update", "Claim" or "ClaimRewards".

If you find an approval to an unkown smart contract, that you signed lately on Revoke.cash - you probably approved your asset to that smart contract.

After you clean up your approvals to smart contracts in doubt, you may continue using the wallet address in question on your own risk.

###### What can be done?

- Revoke malicious token approvals

###### How to prevent?

- Double check URLs
- Use bookmarks
- Use security browser extensions

### Final word of advice

Getting scammed is horrible. However you lost your tokens, from a legal point of view it is important that you take action and report your case to local authorities. This may sound ridiculous, and the chances of success are probably negligible.
Nevertheless, in the event that the fraudsters are caught and your claim is known to the authorities, there is at least a _theoretical_ chance that some of your losses might be recovered one day.
