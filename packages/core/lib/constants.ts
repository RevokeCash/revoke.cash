export const WHOIS_BASE_URL = 'https://whois.revoke.cash/generated';

export const CHROME_EXTENSION_URL =
  'https://chrome.google.com/webstore/detail/revokecash/nmniboccheadcclilkfkonokbcoceced';
export const FIREFOX_EXTENSION_URL = 'https://addons.mozilla.org/en-US/firefox/addon/revoke-cash/';

export const DISCORD_URL = 'https://discord.gg/revoke-cash';
export const GITHUB_URL = 'https://github.com/RevokeCash/revoke.cash';
export const TWITTER_URL = 'https://twitter.com/RevokeCash';
export const TELEGRAM_URL = 'https://t.me/RevokeHQ';

export const ADDRESS_ZERO_PADDED = '0x0000000000000000000000000000000000000000000000000000000000000000' as const;
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000' as const;
export const DUMMY_ADDRESS_PADDED = '0x0000000000000000000000000000000000000000000000000000000000000001' as const;
export const DUMMY_ADDRESS = '0x0000000000000000000000000000000000000001' as const;
export const DUMMY_ADDRESS_2 = '0x0000000000000000000000000000000000000002' as const;

export const MULTICALL_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11' as const;

export const DONATION_ADDRESS = '0xfcBf17200C64E860F6639aa12B525015d115F863' as const; // revoke.eth
export const FEES_ADDRESS = '0xEe826eDbf34f4f33DAd062405d7FbFDFdf405205' as const; // fees.revoke.cash
export const SUBSCRIPTIONS_ADDRESS = '0x92bA92FD6A20EAf141F7AF1483e196Bbc0513EaF' as const; // subscriptions.revoke.cash
export const AUTO_REVOKE_DELEGATION_ADDRESS = '0xD08e8BB3D754641BBF6dd2E797b1B52703f00486' as const; // delegations.revoke.cash
export const AUTO_REVOKE_COLD_ADDRESS = '0x6caD02D9D75660FbF237394ec8463c616E7e26E7' as const; // cold.delegations.revoke.cash
export const AUTO_REVOKE_EXECUTOR_HOT_ADDRESS = '0x5862aB2F23C4241D64B99d509d50B2483a23A793' as const; // hot_1.delegations.revoke.cash

export const UNSTOPPABLE_DOMAINS_ETH_ADDRESS = '0x578853aa776Eef10CeE6c4dd2B5862bdcE767A8B' as const;
export const UNSTOPPABLE_DOMAINS_POLYGON_ADDRESS = '0x91EDd8708062bd4233f4Dd0FCE15A7cb4d500091' as const;
export const AVVY_DOMAINS_ADDRESS = '0x1ea4e7A798557001b99D88D6b4ba7F7fc79406A9' as const;

export const ETHERSCAN_API_KEYS = JSON.parse(process.env.ETHERSCAN_API_KEYS ?? '{}');
export const ETHERSCAN_RATE_LIMITS = JSON.parse(process.env.ETHERSCAN_RATE_LIMITS ?? '{}');

export const RPC_OVERRIDES = JSON.parse(process.env.NODE_URLS ?? process.env.NEXT_PUBLIC_NODE_URLS ?? '{}');

export const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY ?? process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
export const DRPC_API_KEY = process.env.DRPC_API_KEY ?? process.env.NEXT_PUBLIC_DRPC_API_KEY;

export const WEBACY_API_KEY = process.env.WEBACY_API_KEY ?? process.env.NEXT_PUBLIC_WEBACY_API_KEY;
export const FAIRSIDE_API_KEY = process.env.FAIRSIDE_API_KEY ?? process.env.NEXT_PUBLIC_FAIRSIDE_API_KEY;
export const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY ?? process.env.NEXT_PUBLIC_COINGECKO_API_KEY;
export const COINGECKO_API_BASE_URL = 'https://pro-api.coingecko.com/api/v3';

export const CRISP_WEBSITE_ID = process.env.CRISP_WEBSITE_ID ?? process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === 'production' ? 'https://revoke.cash' : 'http://localhost:3000');
