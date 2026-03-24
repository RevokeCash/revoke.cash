---
title: 'The Next Chapter for the Revoke.cash Extension'
description: The threat landscape has evolved far beyond malicious approvals. To keep users safe, the Revoke.cash extension is getting a major upgrade with transaction simulation, address poisoning detection, and theft coverage, powered by a new partnership with Fairside.
date: 2026-03-24
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# Revoke x Fairside: The Next Chapter for the Revoke.cash Extension

When we launched the Revoke.cash browser extension, the biggest threat to crypto users was malicious token approvals. If you could catch a bad approval before it drained your wallet, you were safe. That's no longer the case.

Today's scammers don't just rely on approvals and permit messages. They trick users into signing deceptive transactions that look like legitimate ones. They poison your transaction history with look-alike addresses, hoping you'll copy-paste the wrong one. They buy sponsored Google ads that link to phishing sites.

A tool that only watches for bad approvals is no longer enough. That’s why we’ve partnered with Fairside to build the biggest update to the Revoke extension ever. New features, new partner, and a fully overhauled approach to protecting your wallet.

::video{src="/assets/videos/revoke-extension-update.mp4" title="Revoke Extension Update" width="1080" height="1080" controls preload="metadata"}

Some of you may have already seen an early version of the updated extension. Two weeks ago we released a public beta to gather community feedback. Based on the feedback we received, the model has been refined into two clear tiers: **Revoke Protect Lite** and **Revoke Protect Standard**. The final version with these two plans will be rolling out next week.


## Revoke Protect Lite (Free)

The core of the extension is included in the Lite tier of the extension and includes transaction simulation and Ethos score on X. Even the Lite tier is much more powerful than the entire previous version of the extension.

### Transaction Simulation

The extension now simulates every transaction before you sign it, showing you exactly what will happen: which tokens will leave your wallet, which will arrive, and what approvals will be granted. No more blindly confirming transactions and hoping for the best.

### Ethos Score & Impersonator Detection on X

Crypto Twitter is full of impersonators. The extension now shows Ethos reputation scores on X profiles and flags accounts that are likely impersonating trusted figures, so you can spot fakes before you trust their links or advice.

## Revoke Protect Standard

Revoke Protect Standard includes everything in the Lite plan, plus additional features to help you stay safe. These additional features are made available as part of our partnership with Fairside, who provide the underlying infrastructure, coverage, and associated paid services within the extension.

### Ad Warnings

Scammers routinely buy Google Ads for popular DeFi protocols, directing users to convincing phishing clones. The extension detects and warns you about sponsored search results that link to known or suspected malicious sites.

### Address Poisoning Detection

[Address poisoning](/learn/approvals/address-poisoning) is one of the most effective low-effort scams: attackers send zero-value transactions from addresses that look nearly identical to ones you've interacted with, hoping you'll copy the wrong address next time. The extension flags these poisoned addresses on Etherscan and other block explorers before you make a costly mistake.

### Slow Mode (Hold to Confirm)

For high-value or suspicious transactions, the extension introduces a "hold to confirm" interaction that forces you to pause before signing. This simple friction can be the difference between catching a scam and losing your funds.

### Theft Coverage by Fairside

No protection is 100% bulletproof, so Revoke Protect Standard also includes theft coverage of up to $30,000 provided by [Fairside](https://fairside.io/).

## Partnering with Fairside

Keeping a security extension ahead of the threat landscape requires deep, dedicated expertise in real-time threat detection, the kind that [Fairside](https://fairside.io/) has built their entire company around. The extension is now developed and operated in partnership with Fairside, combining Fairside's security engineering and infrastructure with Revoke's reach and reputation to deliver a stronger product than either of us could build alone.

## On Fees and Coverage

**Revoke Protect Lite is free.** Transaction simulation and Ethos scores are available at no cost, giving you more protection than the entire previous version of the extension.

**Revoke Protect Standard** adds additional protection features and theft coverage. These features are made available as part of our partnership with Fairside, who provide the underlying infrastructure, coverage, and associated paid services within the extension.

## On Going Closed Source

As part of this new setup, the extension is moving to a closed source model. We understand that this is a departure from our open source roots, and we don't take it lightly. But there is a fundamental tension in open source security tooling: the same transparency that allows the community to audit your code also allows the people you're trying to protect against to study it, find gaps, and build workarounds.

This is not a hypothetical concern. We've seen malicious actors specifically target detection logic in open source security tools. Every phishing kit developer and every wallet drainer operator have access to the same source code you do. When your detection rules are public, evading them becomes a matter of reading the code.

This is the same reason that antivirus software, browser security features, and wallet firewalls are typically closed source. The tradeoff between public auditability and effective protection is real, and for a tool whose entire purpose is to catch bad actors, we believe effective protection has to win.

## What's Next for Revoke.cash

With our Fairside partnership, we have a lot of new features and improvements to ship on the extension side. The mission hasn't changed, the extension will continue to evolve with new features that help keep you safe throughout the crypto industry. And with Fairside's dedicated resources, every part of the product gets the attention it deserves
