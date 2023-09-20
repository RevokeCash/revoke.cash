<p align="center">
  <img width="400" src="public/assets/images/revoke.png">
</p>

> _Do you want to swap 10 DAI for ETH? Sure thing, we'll just need your approval to spend a BAJILLION DOLLARS!_

Do you ever feel uneasy about the different dapps that you gave approval to spend ERC20 tokens from your account? [revoke.cash](https://revoke.cash) allows you to inspect all the contracts you've approved to spend money on your behalf, and revoke their access for the ones you no longer need. If you don't want to completely revoke access, it's also possible to update the amount they are allowed to spend instead.

This repository also includes a [list of spender addresses`](/data/spenders), which is a mapping of smart contract addresses to the corresponding application. This allows revoke.cash to display application names like Aave or Compound instead of their smart contract addresses. This list can be used by any other application. The name mapping for an address can be accessed through this URL:

- `https://raw.githubusercontent.com/RevokeCash/revoke.cash/master/data/spenders/{chainId}/{address}.json`

Revoke.cash supports many different chains using different methods, including direct RPC calls, Etherscan and CovalentHQ.

If you want to learn more about (unlimited) token approvals, I wrote an article on my blog: [Unlimited ERC20 allowances considered harmful](https://kalis.me/unlimited-erc20-allowances/).

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
- `ETHERSCAN_API_KEYS` and `ETHERSCAN_RATE_LIMITS` are used for many of the other chains such as BNB Chain or Avalanche.
- `NEXT_PUBLIC_NODE_URLS` is used to override any RPC URLs on the frontend - e.g. if you want to use Alchemy instead of Infura.
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is used for WalletConnect - if omitted, WalletConnect will not work.

If you omit any of these variables, Revoke.cash will not work for the chains you omitted.

Then there are a few less essential variables:

- `IRON_SESSION_PASSWORD` is used for encrypting session cookies and can be filled with any random 32-character string - if omitted many chains will not work.
- `NEXT_PUBLIC_AMPLITUDE_API_KEY` is used for Analytics - if omitted, no Analytics are collected.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are used for queueing third-party API calls - these are only necessary when hosting in a serverless environment such as Vercel.
- `NEXT_PUBLIC_HARPIE_API_KEY` is used to call Harpie's API for getting contract address labels - if omitted it only uses public label data sources.
- `NODE_URLS` is currently unused, but can be used for certain networks in the future.
- `LOCALAZY_API_KEY` is used for generating "Help Us Translate This Page" links - if omitted, those links will not work.

## Contributing

### Adding a new network

Adding a new network is relatively straightforward as you only need to change two files: `lib/utils/chains.ts` and `cypress/e2e/chains.cy.ts`.

#### Prerequisites

To add a new network, one of the following needs to be available:

- A (public or private) RPC endpoint that supports `eth_getLogs` requests for the entire history of the network.
- Support in [CovalentHQ](https://www.covalenthq.com/) for the network.
- A block explorer with an exposed API that is compatible with Etherscan's API (such as Blockscout).

Also make sure that your network is listed in [ethereum-lists/chains](https://github.com/ethereum-lists/chains) (and that is has subsequently been included in [@revoke.cash/chains](https://github.com/RevokeCash/chains)). Besides the earlier requirements, we also require a publicly available RPC endpoint with rate limits that are not too restrictive. It is also helpful if your network is listed (with TVL and volume stats) on DeFiLlama, but this is not required.

#### Adding the network

In `lib/utils/chains.ts`:

- Add the network to `PROVIDER_SUPPORTED_CHAINS`, `BLOCKSCOUT_SUPPORTED_CHAINS`, `ETHERSCAN_SUPPORTED_CHAINS` or `COVALENT_SUPPORTED_CHAINS`.
- Add the network to `CHAIN_SELECT_MAINNETS` or `CHAIN_SELECT_TESTNETS`. You can subsequently run `yarn ts-node scripts/get-chain-order.ts` to determine its position in the network selection dropdown.
- Find a logo (preferably svg) for the network, add it to `public/assets/images/vendor/chains` add the path to `getChainLogo()`.
- If `multicall3` is deployed on the network, add it to `getChainDeployedContracts()`.
- If a price source (Uniswap v2 or Uniswap v3 fork) is available for the network, add it to `getChainPriceStrategies()`.
- If it uses a block explorer API such as Etherscan's or Blockscout's, add the network to `getChainApiUrl()` and if it requires an API key, this should be added to the environment variable `ETHERSCAN_API_KEYS` in `.env`.
- If the data in `ethereum-lists/chains` is different than what should be used by Revoke.cash, add the network to `getChainName()`, `getChainExplorerUrl()`, `getChainRpcUrl()`, `getChainFreeRpcUrl()`, `getChainLogsRpcUrl()`, `getChainNativeToken()`
- Add an amount to `getDefaultDonationAmount()` that corresponds to around $10-20 in the native token of the network.

In `cypress/e2e/chains.cy.ts`:

- Find a wallet that has active approvals and add it to `fixtures`.

## Credits

Website created by Rosco Kalis after discussing the idea with Paul Berg at Devcon 5 in Osaka. Uses [ethers.js](https://github.com/ethers-io/ethers.js) and [wagmi](https://github.com/wagmi-dev/wagmi) for all Ethereum-related operations and [Etherscan](https://etherscan.io), [CovalentHQ](https://www.covalenthq.com/), [Infura](https://infura.io/) & [Alchemy](https://www.alchemy.com/) for extended multichain support. Built with Next.js, Tailwind and TypeScript. Uses Upstash for queueing.
