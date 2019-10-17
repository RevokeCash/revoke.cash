# Revoke.cash
> *Do you want to swap 10 DAI for ETH? Sure thing, we'll just need your approval to spend a BAJILLION DOLLARS!*

Do you ever feel uneasy about the different dapps that you gave approval to spend ERC20 tokens from your account? [revoke.cash](https://revoke.cash) allows you to inspect all the contracts you've approved to spend money on your behalf, and revoke this access for the ones you no longer need.

## Running locally
```
git clone git@github.com:rkalis/revoke.cash.git
cd revoke.cash
yarn
yarn start
```

## Credits
Website created by Rosco Kalis after discussing the idea with Paul Berg at Devcon 5 in Osaka. Uses the [Ethplorer API](https://github.com/EverexIO/Ethplorer/wiki/ethplorer-api) to retrieve token balance information and [ethers.js](https://github.com/ethers-io/ethers.js) for all other Ethereum-related operations. Built with React and TypeScript.
