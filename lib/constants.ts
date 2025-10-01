export const WHOIS_BASE_URL = 'https://whois.revoke.cash/generated';

export const CHROME_EXTENSION_URL =
  'https://chrome.google.com/webstore/detail/revokecash/nmniboccheadcclilkfkonokbcoceced';
export const FIREFOX_EXTENSION_URL = 'https://addons.mozilla.org/en-US/firefox/addon/revoke-cash/';
export const DISCORD_URL = 'https://discord.gg/revoke-cash';
export const GITHUB_URL = 'https://github.com/RevokeCash/revoke.cash';
export const TWITTER_URL = 'https://twitter.com/RevokeCash';

export const ADDRESS_ZERO_PADDED = '0x0000000000000000000000000000000000000000000000000000000000000000' as const;
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000' as const;
export const DUMMY_ADDRESS_PADDED = '0x0000000000000000000000000000000000000000000000000000000000000001' as const;
export const DUMMY_ADDRESS = '0x0000000000000000000000000000000000000001' as const;
export const DUMMY_ADDRESS_2 = '0x0000000000000000000000000000000000000002' as const;
export const OPENSEA_REGISTRY_ADDRESS = '0xa5409ec958C83C3f309868babACA7c86DCB077c1' as const;
export const MOONBIRDS_ADDRESS = '0x23581767a106ae21c074b2276D25e5C3e136a68b' as const;
export const DONATION_ADDRESS = '0xfcBf17200C64E860F6639aa12B525015d115F863' as const; // revokecash.eth
export const MULTICALL_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11' as const;

export const UNSTOPPABLE_DOMAINS_ETH_ADDRESS = '0x578853aa776Eef10CeE6c4dd2B5862bdcE767A8B' as const;
export const UNSTOPPABLE_DOMAINS_POLYGON_ADDRESS = '0x91EDd8708062bd4233f4Dd0FCE15A7cb4d500091' as const;
export const AVVY_DOMAINS_ADDRESS = '0x1ea4e7A798557001b99D88D6b4ba7F7fc79406A9' as const;

export const ETHERSCAN_API_KEYS = JSON.parse(
  process.env.VITE_ETHERSCAN_API_KEYS ?? process.env.ETHERSCAN_API_KEYS ?? '{}',
);
export const ETHERSCAN_RATE_LIMITS = JSON.parse(
  process.env.VITE_ETHERSCAN_RATE_LIMITS ?? process.env.ETHERSCAN_RATE_LIMITS ?? '{}',
);

export const RPC_OVERRIDES = JSON.parse(process.env.VITE_NODE_URLS ?? process.env.NEXT_PUBLIC_NODE_URLS ?? '{}');

export const ALCHEMY_API_KEY =
  process.env.VITE_ALCHEMY_API_KEY ?? process.env.ALCHEMY_API_KEY ?? process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
export const INFURA_API_KEY =
  process.env.VITE_INFURA_API_KEY ?? process.env.INFURA_API_KEY ?? process.env.NEXT_PUBLIC_INFURA_API_KEY;
export const DRPC_API_KEY = process.env.DRPC_API_KEY ?? process.env.NEXT_PUBLIC_DRPC_API_KEY;
export const WEBACY_API_KEY = process.env.WEBACY_API_KEY ?? process.env.NEXT_PUBLIC_WEBACY_API_KEY;
export const NEFTURE_API_KEY = process.env.NEFTURE_API_KEY ?? process.env.NEXT_PUBLIC_NEFTURE_API_KEY;
export const RESERVOIR_API_KEY = process.env.RESERVOIR_API_KEY ?? process.env.NEXT_PUBLIC_RESERVOIR_API_KEY;
export const FAIRSIDE_API_KEY = process.env.FAIRSIDE_API_KEY ?? process.env.NEXT_PUBLIC_FAIRSIDE_API_KEY;
export const KERBERUS_API_KEY = process.env.KERBERUS_API_KEY ?? process.env.NEXT_PUBLIC_KERBERUS_API_KEY;

export const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY ?? process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
export const COINGECKO_API_BASE_URL = 'https://pro-api.coingecko.com/api/v3';
