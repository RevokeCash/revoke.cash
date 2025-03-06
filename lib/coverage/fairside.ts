import ky from 'lib/ky';

const FAIRSIDE_API_URL = 'https://api.test.fairside.dev/v1';
const FAIRSIDE_API_KEY = process.env.NEXT_PUBLIC_FAIRSIDE_API_KEY;

const headers = {
  'api-key': FAIRSIDE_API_KEY,
};

export interface IMembershipInfoPublic {
  statusCode: number;
  hasCover: boolean;
  isActive: boolean;
  validFrom: string | null;
  validUntil: string | null;
  coverAmount: number | null;
  activeClaims: string[];
}

export const getMembershipInfo = async (walletAddress: string): Promise<IMembershipInfoPublic> => {
  return ky.get(`${FAIRSIDE_API_URL}/membership/check-cover/${walletAddress}`, { headers }).json();
};
