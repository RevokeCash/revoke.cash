---
title: How to Verify You're on the Real Revoke.cash
description: Fake Revoke sites appear within hours of any DeFi exploit. Here's a step-by-step verification checklist to confirm you're on the real tool before connecting your wallet.
date: 2026-06-25
author: PhishFort Team
translator: <Your Name Here (or remove)>
---

# How to Verify You're on the Real Revoke.cash

The most dangerous moment to use a DeFi security tool is during a security emergency.

When an exploit warning spreads on Twitter, the instinct is to act fast: find Revoke, connect your wallet and revoke everything. That urgency is exactly what scammers count on. In the hours following any major DeFi hack, fake Revoke interfaces appear across search results, Twitter threads, and Discord servers. They're pixel-accurate replicas of Revoke.cash. The only difference is that connecting your wallet to them drains it.

This guide gives you a concrete verification routine to run before you connect your wallet, even under pressure.

## The Simple Rule: Bookmark First, Search Never

The single most effective protection against fake Revoke sites costs zero effort right now: bookmark **revoke.cash** in your browser today, before any emergency.

During an exploit warning, navigate via your bookmark. Not via search. Not via a link in a tweet. Not via a link in a Discord message. Not even from a channel you trust, because those channels can get compromised as well.

If you don't have the bookmark and need to find the site during a panic:

1. Type **revoke.cash** directly into the address bar
2. Confirm the full URL shows **revoke.cash** — not revoke-cash.app, revoke.cash.io, revokecash.com, or any variation
3. Look for the padlock icon confirming a valid HTTPS certificate before proceeding

That's the baseline. Everything below is belt-and-suspenders.

## URL Verification: What to Check Character by Character

Fake Revoke domains are designed to pass a quick glance. Mobile browsers make this worse by truncating URLs. Here's what to check:

The correct domain is: **revoke.cash**

Common fakes follow predictable patterns. If the URL you're looking at matches any of these structures, close the tab immediately:

| Pattern | Examples | Why it looks convincing |
|---------|----------|------------------------|
| Hyphenated variants | revoke-cash.app, revoke-cash.pro, revoke-cash.store | The hyphen breaks the **.cash** TLD into something that reads as a path |
| Subdomain bolting | revoke.cash-app.finance, revoke.securemycash.xyz | The brand name appears before a fake domain |
| Typosquatting | revokecash.com, revolecash.net, revokie.cash, revuke.cash | The domain is a common misspelling of **revoke.cash** | One character off, invisible at speed |
| Versioning | revoke-v3.cash, v3-revoke.cash | Exploits upgrade anxiety |
| Platform subdomains | revokecash-hxl.pages.dev, revoke-cash-lahana.vercel.app | Trusted CDN infrastructure, looks legitimate |

If you're unsure: close the tab, open a new one, type revoke.cash directly.

## The Exploit Warning Checklist

When you see an urgent "exploit" warning telling you to revoke your permissions immediately, run through this before taking any action:

1. **Is this warning from a single source?** Real security incidents are covered by multiple independent researchers within minutes. If you're seeing a warning from one account and no other credible sources are confirming it, treat it as a scam until verified.
2. **Is the account posting this the real one?** Search the researcher's handle directly. Compare follower counts, post history, and verification badges. Fake accounts use handles like **@ZachXBT_**, **@CertiKAlert_** (trailing underscore), or substituted characters invisible on mobile. The real researcher accounts have years of post history.
3. **Does the warning link directly to a URL?** Legitimate security advisories link to official project channels or project-controlled domains. An "urgent" tweet that includes a direct link to a revoke interface without going through the official project is almost certainly a scam.
4. **Are comments full of people saying they already "saved" their funds?** This is manufactured social proof. Bot networks simulate victims and saviors in comment threads to create false urgency. Treat a comment section full of "just revoked, saved everything" as a red flag, not confirmation.

If even one of these checks fails: stop. Navigate to revoke.cash via bookmark or direct URL entry. Never via the link in the warning.

## Browser Tools That Catch Fakes Before You Do

Two browser-level tools provide an additional detection layer for known malicious domains:

- [PhishFort NightHawk](https://nighthawk.phishfort.com) — A browser extension that cross-references URLs against PhishFort's continuously updated threat intelligence database, which includes the full inventory of known Revoke.cash impersonation domains.
- [Revoke Sidekick](https://chromewebstore.google.com/detail/revokecash-web3-scam-prot/nmniboccheadcclilkfkonokbcoceced) — A browser extension that performs pre-transaction checks and checks for malicious websites.

These tools work in the background. They're most valuable exactly when you're least likely to be careful: during an active panic.

## What PhishFort Found Monitoring Revoke

This guide is informed by threat intelligence from PhishFort, which monitors for impersonation of Revoke as part of an ongoing security partnership.

PhishFort's monitoring has identified 60+ domains impersonating Revoke, including coordinated campaigns using fake security researcher accounts to spread fabricated exploit warnings. The fake domains follow consistent patterns: dormant registration months in advance, then activation during high-fear events. For the technical breakdown of how this infrastructure works, see PhishFort's analysis: [DeFi Phishing After a Protocol Hack: How Threat Actors Steal Smart Contract Permissions](https://phishfort.com/defi-phishing-protocol-hack-smart-contract-permissions/).

If you identify a suspicious site claiming to be Revoke, report it directly to PhishFort's threat intelligence team.

## Quick Reference: The Pre-Connection Checklist

Before you connect your wallet to any revoke tool:
- I navigated here via bookmark or direct URL entry, not a search result or social link
- The full URL in my browser address bar reads https://revoke.cash with no extra characters
- I did not click a link from a tweet, Discord message, or Telegram group to get here
- If I saw an "exploit warning" I verified it through multiple independent sources
- The account that sent the warning has years of post history and matches the real researcher's follower count

If every box is checked: proceed. If any box is not: stop and verify.

## FAQ

::::faq

:::faq-item{question="How do I know if a Revoke.cash warning on Twitter is real?"}
Check multiple independent sources before acting. Real exploits are covered by several security researchers simultaneously. If the warning comes from a single account (even one with a familiar name) and includes a direct link to a revoke interface, treat it as a scam until other credible sources confirm the exploit.
:::

:::faq-item{question="What happens if I connect my wallet to a fake Revoke site?"}
A fake Revoke interface typically prompts you to sign a transaction that grants the malicious contract approval to transfer your tokens. Unlike a legitimate revoke transaction (which removes approvals), this transaction adds a new malicious approval. Depending on the contract, funds can be drained immediately or at a later time.
:::

:::faq-item{question="Is Revoke.cash safe to use?"}
Yes. The official tool at https://revoke.cash is a legitimate, open-source DeFi security tool for reviewing and revoking ERC-20 token approvals. The risk comes from impersonation domains that replicate its interface. Verify the URL before connecting your wallet.
:::

:::faq-item{question="How do fake Revoke sites appear in search results?"}
Threat actors create fake "informational blog" content hosted on reputable platforms (Vercel, GitHub Pages, GitBook) to gain search engine indexing. Once indexed, the content switches to redirect to the malicious interface. This is called search engine poisoning. The safest habit is to never reach Revoke.cash via a search engine.
:::

::::
