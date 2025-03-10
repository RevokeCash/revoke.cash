import { FAIRSIDE_API_KEY } from 'lib/constants';
import ky from 'lib/ky';

const FAIRSIDE_API_URL = 'https://api.fairside.io/v1';

const headers = {
  'api-key': FAIRSIDE_API_KEY,
};

export interface MembershipInfo {
  statusCode: number;
  hasCover: boolean;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  coverAmount: number | null;
  activeClaims: string[];
}

export const getMembershipInfo = async (walletAddress: string): Promise<MembershipInfo> => {
  return ky.get(`${FAIRSIDE_API_URL}/membership/check-cover/${walletAddress}`, { headers }).json();
};
