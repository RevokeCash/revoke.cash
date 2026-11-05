import { LABEL_CDN_TTL_SECONDS } from '@revoke.cash/core/constants';
import { MAX_CHAIN_ID, type PublicTokenLabel } from '@revoke.cash/core/labels/merge';
import { type LabelAddressType, recordLabelRequest } from '@revoke.cash/core/labels/requests';
import type { AddressOnChain } from '@revoke.cash/core/types';
import { parseErrorMessage } from '@revoke.cash/core/utils/errors';
import type { SpenderData } from '@revoke.cash/core/whois';
import { after, NextResponse } from 'next/server';
import { type Address, getAddress } from 'viem';

// Parsing, headers and request counting of the /generated/spenders and /generated/tokens routes. Their contract is
// documented at the top of both route files.

export interface GeneratedLabelRouteProps {
  params: Promise<{ chainId: string; file: string }>;
}

type GetPublicLabel = (chainId: number, address: Address) => Promise<SpenderData | PublicTokenLabel | undefined>;

const CHAIN_ID_PATTERN = /^[1-9][0-9]*$/;
const LABEL_FILE_PATTERN = /^(0x[0-9a-fA-F]{40})\.json$/;

const PUBLIC_LABEL_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': `public, max-age=${LABEL_CDN_TTL_SECONDS}`,
  'Vercel-CDN-Cache-Control': `s-maxage=${LABEL_CDN_TTL_SECONDS}`,
  'X-Robots-Tag': 'noindex',
};

const ERROR_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store',
};

export const handleGeneratedLabelRequest = async (
  props: GeneratedLabelRouteProps,
  addressType: LabelAddressType,
  getPublicLabel: GetPublicLabel,
): Promise<NextResponse> => {
  const key = parseGeneratedLabelKey(await props.params);
  if (!key) return NextResponse.json({}, { status: 404, headers: PUBLIC_LABEL_HEADERS });

  // The store has no data for these chains, and the integer chain_id columns would fail the query
  if (key.chainId > MAX_CHAIN_ID) return NextResponse.json({}, { headers: PUBLIC_LABEL_HEADERS });

  try {
    const publicLabel = await getPublicLabel(key.chainId, key.address);
    after(() => recordLabelRequest(addressType, key.chainId, key.address));
    return NextResponse.json(publicLabel ?? {}, { headers: PUBLIC_LABEL_HEADERS });
  } catch (error) {
    const errorMessage = `Error fetching ${addressType} label`;
    console.error(errorMessage, parseErrorMessage(error), error);
    return NextResponse.json({ message: errorMessage }, { status: 503, headers: ERROR_HEADERS });
  }
};

const parseGeneratedLabelKey = (params: { chainId: string; file: string }): AddressOnChain | undefined => {
  const fileMatch = params.file.match(LABEL_FILE_PATTERN);
  if (!fileMatch || !CHAIN_ID_PATTERN.test(params.chainId)) return undefined;

  const chainId = Number(params.chainId);
  if (!Number.isSafeInteger(chainId)) return undefined;

  return { chainId, address: getAddress(fileMatch[1]) };
};
