---
title: 'Dependency Spotlight: Envio'
description: We are building Revoke.cash on the shoulders of giants. Without the services and tools that we depend on, we would not be able to build the service that we have today. Envio is the fastest and most reliable indexing service on the market.
date: 2025-08-04
author: Rosco Kalis
translator: <Your Name Here (or remove)>
---

# Dependency Spotlight: Envio

We are building Revoke.cash on the shoulders of giants. Without the services and tools that we depend on, we would not be able to build the service that we have today. In this series of blog posts, we will be highlighting some of the services and tools that we depend on, and how they help us build Revoke.cash.

To build a service like Revoke.cash, we need to process a lot of data because we look at users' entire transaction histories to determine the current state of their token approvals. This is a lot of data to process, and it's a lot of data to store. We use several services to help us with this, and Envio is one of the most important ones.

## What is Envio?

[Envio](https://envio.dev) is the fastest and most reliable open source indexing service for Ethereum and 70+ other chains. It offers two distinct ways to index or query data: HyperIndex and HyperSync. HyperIndex is particularly useful when you have specific contracts that you want to index, while HyperSync is useful when you want to look at a very broad range of onchain data.

Because of the nature of the data that we need to process, we use HyperSync to query the data that we need. This has allowed us to support several chains that we would not have been able to support otherwise and has made the performance for several other chains much better than before.

If you want to play around with HyperSync, you can try out the new [HyperSync Builder](https://builder.hypersync.xyz).
