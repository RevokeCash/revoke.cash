import { toPublicTokenLabel } from '@revoke.cash/core/labels/merge';
import { getTokenLabel } from '@revoke.cash/core/labels/tokens';
import { type GeneratedLabelRouteProps, handleGeneratedLabelRequest } from 'lib/api/generated';
import type { NextRequest } from 'next/server';
import type { Address } from 'viem';

// GET /generated/tokens/{chainId}/{address}.json, the public token label API (also on whois.revoke.cash). A rewrite in
// next.config.js serves it from this route, which revoke.cash's own code calls at /api/labels/tokens/...:
// - Found: 200 {symbol?, decimals?, logoURI?, isSpam?}, only the fields that are set, never null.
// - Valid chain id and address, no rows: 200 {}.
// - Chain id above MAX_CHAIN_ID: 200 {} without a query, because the store has no data for such chains.
// - Chain id not a positive safe integer (0 included), or file not 0x + 40 hex + .json: 404 {}.
// - Database error: 503 {message} with Cache-Control: no-store.
// Any address case is accepted. 200 and 404 send Access-Control-Allow-Origin: *, X-Robots-Tag: noindex and a public
// cache of LABEL_CDN_TTL_SECONDS in the browser and on the Vercel CDN. This route never enriches: it serves no
// computed token metadata.

export const maxDuration = 10;

export async function GET(_request: NextRequest, props: GeneratedLabelRouteProps) {
  return handleGeneratedLabelRequest(props, 'token', getPublicTokenLabel);
}

const getPublicTokenLabel = async (chainId: number, address: Address) => {
  const tokenLabel = await getTokenLabel(chainId, address);
  return tokenLabel ? toPublicTokenLabel(tokenLabel) : undefined;
};
