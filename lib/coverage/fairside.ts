import { FAIRSIDE_API_KEY } from 'lib/constants';
import ky from 'lib/ky';
import type { Hex } from 'viem';
import type { Address } from 'viem';

export const FAIRSIDE_REFERRAL_CODE = 'rHJeTS8YIYdOLq75LpCJ5F863';
export const FAIRSIDE_API_URL = 'https://api.fairside.io/v1';
export const FAIRSIDE_APP_URL = `https://app.fairside.io?referralCode=${FAIRSIDE_REFERRAL_CODE}`;
export const FAIRSIDE_LANDING_URL = `https://fairside.io?referralCode=${FAIRSIDE_REFERRAL_CODE}`;

const headers = {
  'api-key': FAIRSIDE_API_KEY,
};

export interface InactiveMembershipInfo {
  statusCode: number;
  hasCover: false;
  isActive: false;
  validFrom: null;
  validUntil: null;
  coverAmount: null;
  activeClaims: [];
}

export interface ActiveMembershipInfo {
  statusCode: number;
  hasCover: true;
  isActive: true;
  validFrom: string;
  validUntil: string;
  coverAmount: number;
  activeClaims: string[];
}

interface GetMembershipInfoParams {
  walletAddress: string;
}

export type MembershipInfo = InactiveMembershipInfo | ActiveMembershipInfo;

export const getMembershipInfo = async ({ walletAddress }: GetMembershipInfoParams): Promise<MembershipInfo> => {
  return ky.get(`${FAIRSIDE_API_URL}/membership/check-cover/${walletAddress}`, { headers }).json();
};

interface GetAuthenticationMessageParams {
  walletAddress: Address;
}

export interface AuthenticationMessage {
  nonce: string;
  walletAddress: Address;
  message: string;
}

export const getAuthenticationMessage = async ({
  walletAddress,
}: GetAuthenticationMessageParams): Promise<AuthenticationMessage> => {
  const result = await ky
    .post(`${FAIRSIDE_API_URL}/auth/messages`, { headers, json: { walletAddress } })
    .json<{ authMessage: AuthenticationMessage }>();

  if (!result.authMessage.message.includes('Fairside')) {
    throw new Error('Invalid message');
  }

  return result.authMessage;
};

interface LoginUserParams {
  walletAddress: Address;
  signature: Hex;
  nonce: string;
  referralCode: string;
}

type AuthenticationToken = string;

export const loginUser = async (params: LoginUserParams): Promise<AuthenticationToken> => {
  const result = await ky
    .post(`${FAIRSIDE_API_URL}/auth/login`, { headers, json: params })
    .json<{ jwtToken: string }>();
  return result.jwtToken;
};

interface GetCoveredWalletsParams {
  accessToken: AuthenticationToken;
}

interface CoveredWallet {
  id: string;
  memebershipId: number;
  coverID: number;
  active: boolean;
  walletAddress: Address;
}

export const getCoveredWallets = async ({ accessToken }: GetCoveredWalletsParams): Promise<CoveredWallet[]> => {
  const result = await ky
    .get(`${FAIRSIDE_API_URL}/membership/wallets`, { headers: { ...headers, Authorization: `Bearer ${accessToken}` } })
    .json<{ data: CoveredWallet[] }>();
  return result.data;
};
