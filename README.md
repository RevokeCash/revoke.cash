<p align="center">
  <img width="400" src="public/revoke.png">
</p>

> *Do you want to swap 10 DAI for ETH? Sure thing, we'll just need your approval to spend a BAJILLION DOLLARS!*

Do you ever feel uneasy about the different dapps that you gave approval to spend ERC20 tokens from your account? [revoke.cash](https://revoke.cash) allows you to inspect all the contracts you've approved to spend money on your behalf, and revoke their access for the ones you no longer need. If you don't want to completely revoke access, it's also possible to update the amount they are allowed to spend instead.

This repository also includes the [`dapp-contract-list`](/public/dapp-contract-list/), which is a mapping of smart contract addresses to the corresponding application. This allows revoke.cash to display application names like Aave or Compound instead of their smart contract addresses. This list can be used by any other application. The name mapping for an address can be accessed through either of these URLs:

- `https://raw.githubusercontent.com/rkalis/revoke.cash/master/public/dapp-contract-list/{chain}/{address}.json`
- `https://revoke.cash/dapp-contract-list/{chain}/{address}.json`

Revoke.cash currently only works for Ethereum (mainnet and testnets), Arbitrum, xDAI, Avalanche and SmartBCH.

If you want to learn more about (unlimited) ERC20 allowances, I wrote an article on my blog: [Unlimited ERC20 allowances considered harmful](https://kalis.me/unlimited-erc20-allowances/).

## Running locally
```
git clone git@github.com:rkalis/revoke.cash.git
cd revoke.cash
yarn
yarn start
```

## Credits
Website created by Rosco Kalis after discussing the idea with Paul Berg at Devcon 5 in Osaka. Uses [wagmi](https://github.com/tmm/wagmi) and [ethers.js](https://github.com/ethers-io/ethers.js) for all Ethereum-related operations. Filters out unverified tokens using tokenlists. Built with React, Bootstrap and TypeScript.
