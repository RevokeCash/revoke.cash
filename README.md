<p align="center">
  <img width="400" src="public/assets/images/revoke.png">
</p>

> _Do you want to swap 10 DAI for ETH? Sure thing, we'll just need your approval to spend a BAJILLION DOLLARS!_

Do you ever feel uneasy about the different dapps that you gave approval to spend ERC20 tokens from your account? [revoke.cash](https://revoke.cash) allows you to inspect all the contracts you've approved to spend money on your behalf, and revoke their access for the ones you no longer need. If you don't want to completely revoke access, it's also possible to update the amount they are allowed to spend instead.

This repository also includes the [`dapp-contract-list`](/public/dapp-contract-list/), which is a mapping of smart contract addresses to the corresponding application. This allows revoke.cash to display application names like Aave or Compound instead of their smart contract addresses. This list can be used by any other application. The name mapping for an address can be accessed through either of these URLs:

- `https://raw.githubusercontent.com/rkalis/revoke.cash/master/public/dapp-contract-list/{chainId}/{address}.json`
- `https://revoke.cash/dapp-contract-list/{chainId}/{address}.json`

Revoke.cash natively supports Ethereum (mainnet and testnets), Gnosis Chain, Telos, Metis, Fuse and SmartBCH.

It also supports Avalanche, Polygon, BSC, Arbitrum, Optimism, RSK, Fantom, Harmony, HECO, Moonbeam, Moonriver, and Cronos through a backend integration with Etherscan, CovalentHQ & Alchemy. Performance for these chains may be slower due to rate limits.

If you want to learn more about (unlimited) ERC20 allowances, I wrote an article on my blog: [Unlimited ERC20 allowances considered harmful](https://kalis.me/unlimited-erc20-allowances/).

## Running locally

```
git clone git@github.com:rkalis/revoke.cash.git
cd revoke.cash
yarn
yarn dev
```

If you want to use the extended multichain support, you'll also need to copy the `.example.env` file into `.env` and fill it with a random 32-character `IRON_SESSION_PASSWORD`, a list of `COVALENT_API_KEYS` that you can request on their website, a mapping of `NODE_URLS`, and a mapping of Etherscan-like platform API keys.

If you need to run the application in a serverless environment, you'll need to configure an [Upstash](https://upstash.com) database and add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables. If none are configured, rate limiting external API calls will be done with an in-memory queue.

## Credits

Website created by Rosco Kalis after discussing the idea with Paul Berg at Devcon 5 in Osaka. Uses [ethers.js](https://github.com/ethers-io/ethers.js) for all Ethereum-related operations and [Etherscan](https://etherscan.io), [CovalentHQ](https://www.covalenthq.com/) & [Alchemy](https://www.alchemy.com/) for extended multichain support. Filters out unverified tokens using tokenlists. Built with Next.js, Bootstrap and TypeScript. Uses Upstash for queueing.
