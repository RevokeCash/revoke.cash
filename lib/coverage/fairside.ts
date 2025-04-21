import { FAIRSIDE_API_KEY } from 'lib/constants';
import ky from 'lib/ky';
import type { Hex } from 'viem';
import type { Address } from 'viem';

export const FAIRSIDE_REFERRAL_CODE = 'rHJeTS8YIYdOLq75LpCJ5F863';
export const FAIRSIDE_API_URL = 'https://api.fairside.io/v1';
export const FAIRSIDE_APP_URL = `https://app.fairside.io?referralCode=${FAIRSIDE_REFERRAL_CODE}`;
export const FAIRSIDE_LANDING_URL = `https://fairside.io?referralCode=${FAIRSIDE_REFERRAL_CODE}`;
export const FAIRSIDE_CAMPAIGN_URL = 'https://forms.gle/VTYtEaHHbvTHAC8NA';

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

// Constants for coverage session
const COVERAGE_SESSION_ID_KEY = 'coverage_session_id';
const COVERAGE_SESSION_START_KEY = 'coverage_session_start';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Generate a random string for session ID
const generateSessionId = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const id = Array.from({ length: 20 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  return isLocalhost ? `${id}-test` : id;
};

// Get or create a session ID with 30-minute expiration
const getSessionId = (): string => {
  if (typeof window === 'undefined') return generateSessionId();

  const storedId = localStorage.getItem(COVERAGE_SESSION_ID_KEY);
  const storedTimestamp = localStorage.getItem(COVERAGE_SESSION_START_KEY);
  const now = Date.now();

  // Check if we have a valid, non-expired ID
  if (storedId && storedTimestamp) {
    const timestamp = Number.parseInt(storedTimestamp, 10);
    if (now - timestamp < SESSION_DURATION) {
      return storedId;
    }
  }

  // Generate new ID if expired or doesn't exist
  const newId = generateSessionId();
  localStorage.setItem(COVERAGE_SESSION_ID_KEY, newId);
  localStorage.setItem(COVERAGE_SESSION_START_KEY, now.toString());
  return newId;
};

type QuizAction =
  | 'coverage_tab_view'
  | 'quiz_start'
  | 'quiz_1_question'
  | 'quiz_2_question'
  | 'quiz_3_question'
  | 'quiz_4_question'
  | 'quiz_5_question'
  | 'quiz_complete'
  | 'get_coverage_click';

// Track quiz actions
export const trackQuizAction = async (action: QuizAction): Promise<void> => {
  const userId = getSessionId();

  try {
    await ky.post(`${FAIRSIDE_API_URL}/revoke-stats`, {
      headers,
      json: {
        userId,
        action,
      },
    });
  } catch (error) {
    console.error('Failed to track Fairside quiz action:', error);
  }
};
