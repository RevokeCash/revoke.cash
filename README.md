<p align="center">
  <img width="400" src="public/assets/images/revoke-wordmark-black.svg">
</p>

> _Do you want to swap 10 DAI for ETH? Sure thing, we'll just need your approval to spend a BAJILLION DOLLARS!_

Do you ever feel worried about the different apps that have access to the tokens in your wallet? [revoke.cash](https://revoke.cash) allows you to inspect all the contracts you've approved to spend money on your behalf, and revoke their access for the ones you no longer need. If you don't want to completely revoke access, it's also possible to update the amount they are allowed to spend instead.

If you want to learn more about (unlimited) token approvals, I wrote an article on my blog: [Unlimited ERC20 allowances considered harmful](https://kalis.me/unlimited-erc20-allowances/).

## Running locally

```
git clone git@github.com:RevokeCash/revoke.cash.git
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
- `COVALENT_API_KEY` and `COVALENT_RATE_LIMIT` is used for certain chains such as Harmony.
- `ETHERSCAN_API_KEYS` and `ETHERSCAN_RATE_LIMITS` are used for many of the other chains such as BNB Chain or Avalanche.
- `NEXT_PUBLIC_NODE_URLS` is used to override any RPC URLs on the frontend - e.g. if you want to use Alchemy instead of Infura.
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is used for WalletConnect - if omitted, WalletConnect will not work.

If you omit any of these variables, Revoke.cash will not work for the chains you omitted.

Then there are a few less essential variables:

- `IRON_SESSION_PASSWORD` is used for encrypting session cookies and can be filled with any random 32-character string - if omitted many chains will not work.
- `NEXT_PUBLIC_MIXPANEL_API_KEY` is used for Analytics - if omitted, no Analytics are collected.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are used for queueing third-party API calls - these are only necessary when hosting in a serverless environment such as Vercel.
- `RESERVOIR_API_KEY` is used for fetching NFT prices - if omitted, NFT prices will not be shown.
- `NODE_URLS` is currently unused, but can be used for certain networks in the future.
- `LOCALAZY_API_KEY` is used for generating "Help Us Translate This Page" links - if omitted, those links will not work.

## Contributing

### Adding a new network

Adding a new network is relatively straightforward as you only need to change three files: `lib/utils/chains.ts`, `cypress/e2e/chains.cy.ts` and `locales/en/networks.json`.

#### Prerequisites

To add a new network, **one** of the following needs to be available:

- A (public or private) RPC endpoint that supports `eth_getLogs` requests for the entire history of the network.
- Or: Support in [GoldRush](https://goldrush.dev/) for the network.
- Or: A block explorer with an exposed API that is compatible with Etherscan's API (such as Blockscout).
- Or: A [HyperSync](https://docs.envio.dev/docs/HyperSync/overview) instance with at least a Bronze tier.

Also make sure that your network is listed in [ethereum-lists/chains](https://github.com/ethereum-lists/chains) (and that it has subsequently been included in [@revoke.cash/chains](https://github.com/RevokeCash/chains)). Besides the earlier requirements, we also require a publicly available RPC endpoint with rate limits that are not too restrictive. It is also helpful if your network is listed (with TVL and volume stats) on DeFiLlama, but this is not required.

#### Adding the network

In `lib/utils/chains.ts`:

- Add a network configuration for the network to the `CHAINS` mapping. A network configuration can include the following properties, and need to be filled out accordingly. `name`, `infoUrl`, `nativeToken`, `explorerUrl` and `rpc` only need to be added if the data in `ethereum-lists/chains` is different than what should be used by Revoke.cash
  - `type`: The type of support, can be `SupportType.PROVIDER` for networks with a public RPC endpoint, `SupportType.COVALENT` for networks supported by CovalentHQ, or `SupportType.ETHERSCAN_COMPATIBLE` for networks with a block explorer API.
  - `chainId`: The chain ID of the network.
  - `name`: The name of the network.
  - `logoUrl`: The URL of the network's logo. Add a logo file (preferably svg) to `public/assets/images/vendor/chains` and add the path here.
  - `infoUrl` (Optional): The URL of the network's website.
  - `nativeToken` (Optional): The symbol of the network's native token.
  - `nativeTokenCoingeckoId` (Optional): The Coingecko ID of the network's native token.
  - `explorerUrl` (Optional): The URL of the network's block explorer.
  - `etherscanCompatibleApiUrl` (Only for `SupportType.ETHERSCAN_COMPATIBLE`): The URL of the network's block explorer API.
  - `rpc.main` (Optional): The URL of the network's RPC endpoint.
  - `rpc.logs` (Optional): The URL of the network's RPC endpoint for fetching logs (if different from `main`).
  - `rpc.free` (Optional): The URL of the network's free RPC endpoint (will be used when adding the network to a wallet).
  - `deployedContracts` (Optional): If multicall3 is deployed to the network, set this to `{ ...MULTICALL }` (check on https://www.multicall3.com/).
  - `priceStrategy` (Optional): If a price source (Uniswap v2 or Uniswap v3 fork), add a corresponding `PriceStrategy` to enable token pricing.
  - `backendPriceStrategy` (Optional): If Reservoir has an API endpoint for the network, add a corresponding `ReservoirPriceStrategy` to enable NFT pricing.
  - `isTestnet` (Optional): Whether the network is a testnet.
  - `isCanary` (Optional): Whether the network is a canary network.
  - `correspondingMainnetChainId` (Optional): The chain ID of the corresponding mainnet network (only for testnets or canary networks).
- Add the network to `CHAIN_SELECT_MAINNETS` or `CHAIN_SELECT_TESTNETS` depending on whether it is a mainnet or testnet. You can subsequently run `yarn tsx scripts/get-chain-order.ts` to determine its rough position in the network selection dropdown.

In `cypress/e2e/chains.cy.ts`:

- Find a wallet that has active approvals and add it to `fixtures`.

In `locales/en/networks.json`:

- Add a one-paragraph description for the network in the `"networks"` object under the correct slug.
- An admin will then need to run `yarn translations:update` to make sure this description gets forwarded to translators.

## Credits

Website created by Rosco Kalis after discussing the idea with Paul Berg at Devcon 5 in Osaka. Uses [viem](https://github.com/wagmi-dev/viem) and [wagmi](https://github.com/wagmi-dev/wagmi) for all Ethereum-related operations and [Etherscan](https://etherscan.io), [CovalentHQ](https://www.covalenthq.com/), [Infura](https://infura.io/) & [Alchemy](https://www.alchemy.com/) for extended multichain support. Built with Next.js, Tailwind and TypeScript. Uses Upstash for queueing.
