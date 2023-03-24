<p align="center">
  <img width="400" src="public/assets/images/revoke.png">
</p>

> _Do you want to swap 10 DAI for ETH? Sure thing, we'll just need your approval to spend a BAJILLION DOLLARS!_

Do you ever feel uneasy about the different dapps that you gave approval to spend ERC20 tokens from your account? [revoke.cash](https://revoke.cash) allows you to inspect all the contracts you've approved to spend money on your behalf, and revoke their access for the ones you no longer need. If you don't want to completely revoke access, it's also possible to update the amount they are allowed to spend instead.

This repository also includes the [`dapp-contract-list`](/public/dapp-contract-list/), which is a mapping of smart contract addresses to the corresponding application. This allows revoke.cash to display application names like Aave or Compound instead of their smart contract addresses. This list can be used by any other application. The name mapping for an address can be accessed through either of these URLs:

- `https://raw.githubusercontent.com/rkalis/revoke.cash/master/public/dapp-contract-list/{chainId}/{address}.json`
- `https://revoke.cash/dapp-contract-list/{chainId}/{address}.json`

Revoke.cash natively supports Ethereum (mainnet and testnets), Gnosis Chain, Metis, SmartBCH, Syscoin and Ethereum Classic.

It also supports Avalanche, Polygon, BSC, Arbitrum, Optimism, RSK, Fantom, Harmony and several other chains through a backend integration with Etherscan, Blockscout, CovalentHQ & Alchemy. Performance for these chains may be slower due to rate limits.

If you want to learn more about (unlimited) ERC20 allowances, I wrote an article on my blog: [Unlimited ERC20 allowances considered harmful](https://kalis.me/unlimited-erc20-allowances/).

## Running locally

```
git clone git@github.com:rkalis/revoke.cash.git
cd revoke.cash
yarn
yarn dev
```

### Environment variables

An `.example.env` file is provided that needs to be copied into a `.env` file and filled out.

Some of these variables are integral to the functioning of Revoke.cash:

- `NEXT_PUBLIC_INFURA_API_KEY` is used for reading data from Ethereum + Testnets.
- `NEXT_PUBLIC_ALCHEMY_API_KEY` is used for reading data from Polygon, Optimism and Arbitrum + Testnets
  - Alchemy is also used for ENS and UNS name resolutions - if omitted those resolutions will not work.
- `COVALENT_API_KEY` and `COVALENT_IS_PREMIUM` is used for certain chains such as Evmos and Harmony.
- `ETHERSCAN_API_KEYS` is used for many of the other chains such as BSC or Avalanche.
- `NEXT_PUBLIC_NODE_URLS` is used to override any RPC URLs on the frontend - e.g. if you want to use Alchemy instead of Infura.

If you omit any of these variables, Revoke.cash will not work for the chains you omitted.

Then there are a few less essential variables:

- `IRON_SESSION_PASSWORD` is used for encrypting session cookies and can be filled with any random 32-character string - if omitted many chains will not work.
- `NEXT_PUBLIC_AMPLITUDE_API_KEY` is used for Analytics - if omitted, no Analytics are collected.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are used for queueing third-party API calls - these are only necessary when hosting in a serverless environment such as Vercel.
- `NEXT_PUBLIC_HARPIE_API_KEY` is used to call Harpie's API for getting contract address labels - if omitted it only uses public label data sources.
- `NODE_URLS` is currently unused, but can be used for certain networks in the future.

## Credits

Website created by Rosco Kalis after discussing the idea with Paul Berg at Devcon 5 in Osaka. Uses [ethers.js](https://github.com/ethers-io/ethers.js) for all Ethereum-related operations and [Etherscan](https://etherscan.io), [CovalentHQ](https://www.covalenthq.com/) & [Alchemy](https://www.alchemy.com/) for extended multichain support. Built with Next.js, Tailwind and TypeScript. Uses Upstash for queueing.
