---
title: 'Ledger Connect Kit Hack: Retrospective'
description: On the 14th of December, Ledger's connection library (ledger-connect-kit) was compromised. This impacted many websites in the crypto space, including Revoke.cash. We dive into the cause and lessons learned.
date: 2023-12-15
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# Ledger Connect Kit Hack: Retrospective

I was having lunch with my friend David when I noticed some notifications pop up on my phone. At first, I figured they could wait until after lunch, but when I glanced at the content I realized it was very serious. After reading that our frontend was compromised I left David with the lunch bill and sprinted back to the office.

Back at the office I tried to find a way to completely shut down a deployed website on Vercel. Failing that, I did the next best thing: pay Vercel $150 to lock the website behind an authentication screen. This would prevent any new users from accessing the website for the time being, giving me time to figure out what happened and how to fix it.

## What Went Wrong

Revoke.cash uses the popular [Wagmi](https://wagmi.sh/) library to connect to users' wallets and communicate with the blockchain. This library, in turn, uses Ledger's `ledger-connect-kit` library for connecting to Ledger devices. And due to vulnerabilities in Ledger's development processes, an unauthorized party was able to publish a malicious version of `ledger-connect-kit`.

This malicious version of `ledger-connect-kit` injected a script into the websites that used it. Upon connecting your wallet, this script would send malicious transaction or signature requests to users' wallets. If those users then approved these requests in their wallets, they would lose their funds to the scammer.

Ledger has released [a statement](https://www.ledger.com/blog/a-letter-from-ledger-chairman-ceo-pascal-gauthier-regarding-ledger-connect-kit-exploit) of their accounts of the events on the Ledger website. In the explanation below, we use the information from that statement to explain what happened. **Update**: Ledger has released [a more detailed explanation](https://www.ledger.com/blog/security-incident-report) of the exploit. We have updated the explanation below to reflect this new information and to correct some inaccuracies about Ledger's development practices.

### Supply Chain Attack

Because so many crypto websites use these libraries, the malicious version of `ledger-connect-kit` was able to steal funds from many users from different popular websites. And Revoke.cash was one of the websites that was impacted. This kind of attack is known as a [supply chain attack](https://en.wikipedia.org/wiki/Supply_chain_attack).

Generally speaking, developers protect against supply chain attacks by "pinning" the versions of dependencies that they install. This means that instead of always using the latest version of a dependency, they install a specific version. This way, if a dependency is compromised, the developer will not be impacted until they update to the compromised version. **This is also a technique that we use.**

### Ledger's Distribution Mechanism

However, Ledger's `ledger-connect-kit` library uses a different distribution mechanism than most libraries. Instead of accessing the library from NPM (Node Package Manager), they distribute the library through a CDN (Content Delivery Network). This means that developers cannot pin the version of `ledger-connect-kit` that they use. Instead, they always get the latest version, even if they don't opt in.

![Ledger Connect Kit Loader](/assets/images/blog/2023/ledger-connect-kit-hack-retrospective/connect-kit-loader.png)

This is precisely what made this exploit so dangerous. Because application developers could not pin the version of `ledger-connect-kit` that they use, they were always using the latest version. And when the malicious version was published, they were immediately impacted - with the only way to fix it being to completely rip out the dependency and redeploy their website.

### Ledger's Development Practices

The section above explains how this exploit was able to propagate to so many websites in such a short time. But it does not yet explain how the library was able to get compromised in the first place. And the answer to that question lies mostly in Ledger's development practices.

In general, companies that develop software have a process in place to ensure that only authorized people can publish new versions of their software, and employ mandatory 2FA (Two Factor Authentication) on their deployment systems. This ensures that even if a developer's account is compromised, the attacker cannot publish a malicious version of the software.

Ledger has confirmed in their most recent statement that have these practices in place. However, they also used API keys for deployment to NPM, which circumvent the 2FA requirement. This meant that if such an API key was compromised, the attacker could publish a malicious version of the software without requiring 2FA.

In this case, the attacker was able to obtain such an API key by compromising an API key belonging to a developer that no longer worked for Ledger. This means that Ledger failed to properly revoke the API key when the developer left the company, which allowed the attacker to publish a malicious version of the software using this ex-employee's API key.

## Lessons Learned

The Ledger Connect Kit Hack was a big wake up call for the entire crypto industry. While Ledger's library was compromised today, it could be a different library tomorrow. And it could again be a library that Revoke.cash depends on. So what can we learn from this hack?

### What We Did Right

As soon as we were alerted to the hack, we took immediate action to prevent any new users from being impacted. We locked the website behind an authentication screen, preventing any new users from accessing the website. We also notified our users of the hack through announcements on Twitter and Discord. We then started investigating the hack to figure out what happened and how to fix it.

![Revoke.cash Tweet](/assets/images/blog/2023/ledger-connect-kit-hack-retrospective/revokecash-tweet.png)

While we were working on removing the affected dependency, we also made sure to engage with our community on Twitter Spaces to give our account of what happened. We believe our swift action and transparency helped prevent much bigger losses. And we will continue to be transparent about what happened and what we are doing to fix it.

After about one hour of downtime, we were able to remove the affected dependency and redeploy the website. This meant that users could again access the website and revoke any affected approvals. So to be clear: **Revoke.cash is safe to use again**.

### What We Should Have Done Better

While we mentioned earlier that we already pin our NPM dependency versions, we failed to realise that the `ledger-connect-kit` library was not pinnable due to its distribution mechanism. This meant that we were always using the latest version of the library, and we were immediately impacted when the malicious version was published.

And while Ledger should not have published their library in this way, we should not have used the library either. We should have realised that this library's distribution mechanism was a security risk. And we should have looked for a different way to connect to Ledger devices.

### What We Will Do Differently

The biggest lesson to learn here is to be very very careful about the libraries that we use. And while it is very hard to completely prevent supply chain attacks, there are things that developers can do to mitigate the risk. And the most important of those is to pin the versions of dependencies that we use.

But because this specific library was loaded from a CDN instead of bundled with the application, we need to take it a step further: we need to avoid using libraries that are distributed in this way. And that means that we will not re-add the `ledger-connect-kit` library to Revoke.cash until we can do so without using the CDN. Ledger has confirmed that they are working on a solution for this.

We are currently working to thoroughly audit the rest of our dependencies so we do not use any libraries that could be compromised in the same way, making sure that all our dependencies are bundled with the rest of our code. And we will continue to do this in the future to ensure that we are not vulnerable to supply chain attacks.

## Impacted Users

While we were able to prevent much bigger losses by locking the website behind an authentication screen, some users were still impacted. We know that the only time window in which users could have been impacted was **between 11:00 and 13:00 UTC on the 14th of December**.

Even within that time window, only certain users were impacted. From our investigation, users who already had their wallet connected from previous visits to Revoke.cash were not impacted. And the hacker's script malfunctioned for many users as well, meaning that they were also not impacted.

![Exploit Checker](/assets/images/blog/2023/ledger-connect-kit-hack-retrospective/exploit-checker.png)

If you want to check if the scammers _still_ have access to your funds, you can use the [Exploit Checker](/exploits/ledger-connect-kit) on Revoke.cash. If you are impacted, you will see a warning message and you will be directed to revoke the affected approvals. If you are not impacted, you will see a success message and you can rest assured that your funds are safe from here on out.

Due to the widespread nature of the exploit, it is impossible to determine which of the victims of the exploit got compromised on Revoke.cash and which got compromised on other websites. This is why we unfortunately do not see it as a feasible solution for Revoke.cash or other affected websites to directly compensate impacted users.

**Ledger has stated that they will compensate all victims of the exploit**, and we commend them for doing so. We recommend affected users to [contact Ledger support](https://support.ledger.com/hc/en-us/articles/4423020306705-Contact-Us?support=true) about this matter.

## Conclusion

We deeply regret that this has happened to our users and the users of other popular crypto websites. We understand that Revoke.cash is a tool that many users rely on to keep their funds safe, and it should never have been compromised. Even though we were not directly responsible for the compromised library, we do find it regrettable that our use of the library impacted our users in this way. And for that we are truly sorry.

We hope that our swift action and transparency throughout this process shows that we are committed to keeping our users safe. And we will continue to do everything in our power to keep our users safe in the future. We will also continue to be transparent about any issues and what we are doing to fix them.
