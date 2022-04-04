export const TRUSTWALLET_BASE_URL =
  "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains";
export const DAPP_LIST_BASE_URL = "/dapp-contract-list";

export const ADDRESS_ZERO_PADDED =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export const DUMMY_ADDRESS = '0x0000000000000000000000000000000000000001';
export const DUMMY_ADDRESS_2 = '0x0000000000000000000000000000000000000002';
export const OPENSEA_REGISTRY_ADDRESS = '0xa5409ec958C83C3f309868babACA7c86DCB077c1';

export const IRON_OPTIONS = {
  cookieName: "revoke_session",
  password: process.env.IRON_SESSION_PASSWORD,
  ttl: 60 * 60 * 24,
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  }
};
