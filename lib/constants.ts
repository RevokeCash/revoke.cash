export const DATA_BASE_URL = 'https://raw.githubusercontent.com/RevokeCash/revoke.cash/master/data';

export const ETHEREUM_LISTS_CONTRACTS = 'https://raw.githubusercontent.com/ethereum-lists/contracts/main';
export const CHROME_EXTENSION_URL =
  'https://chrome.google.com/webstore/detail/revokecash/nmniboccheadcclilkfkonokbcoceced';
export const FIREFOX_EXTENSION_URL = 'https://addons.mozilla.org/en-US/firefox/addon/revoke-cash/';
export const DISCORD_URL = 'https://discord.gg/revoke-cash';
export const GITHUB_URL = 'https://github.com/RevokeCash/revoke.cash';
export const TWITTER_URL = 'https://twitter.com/RevokeCash';

export const ADDRESS_ZERO_PADDED = '0x0000000000000000000000000000000000000000000000000000000000000000';
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export const DUMMY_ADDRESS = '0x0000000000000000000000000000000000000001';
export const DUMMY_ADDRESS_2 = '0x0000000000000000000000000000000000000002';
export const OPENSEA_REGISTRY_ADDRESS = '0xa5409ec958C83C3f309868babACA7c86DCB077c1';
export const MOONBIRDS_ADDRESS = '0x23581767a106ae21c074b2276D25e5C3e136a68b';
export const DONATION_ADDRESS = '0xfcBf17200C64E860F6639aa12B525015d115F863'; // revokecash.eth

export const ETHERSCAN_API_KEYS = JSON.parse(process.env.ETHERSCAN_API_KEYS ?? '{}');
export const ETHERSCAN_RATE_LIMITS = JSON.parse(process.env.ETHERSCAN_RATE_LIMITS ?? '{}');

export const RPC_OVERRIDES = JSON.parse(process.env.NEXT_PUBLIC_NODE_URLS ?? '{}');

export const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY ?? process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
export const INFURA_API_KEY = process.env.INFURA_API_KEY ?? process.env.NEXT_PUBLIC_INFURA_API_KEY;
