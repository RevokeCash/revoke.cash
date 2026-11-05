import { toPublicSpenderLabel } from '@revoke.cash/core/labels/merge';
import { getCuratedSpenderRows } from '@revoke.cash/core/labels/spenders';
import { type GeneratedLabelRouteProps, handleGeneratedLabelRequest } from 'lib/api/generated';
import type { NextRequest } from 'next/server';
import type { Address } from 'viem';

// GET /generated/spenders/{chainId}/{address}.json, the public spender label API (also on whois.revoke.cash). A rewrite
// in next.config.js serves it from this route, which revoke.cash's own code calls at /api/labels/spenders/...:
// - Found: 200 {name?, riskFactors?}. The name is the chain label's, else the all-chains label's. riskFactors holds the
//   curated factors and the non-fixed exploit factors, and is left out when empty.
// - Valid chain id and address, no rows: 200 {}.
// - Chain id above MAX_CHAIN_ID: 200 {} without a query, because the store has no data for such chains.
// - Chain id not a positive safe integer (0 included), or file not 0x + 40 hex + .json: 404 {}.
// - Database error: 503 {message} with Cache-Control: no-store.
// Any address case is accepted. 200 and 404 send Access-Control-Allow-Origin: *, X-Robots-Tag: noindex and a public
// cache of LABEL_CDN_TTL_SECONDS in the browser and on the Vercel CDN. This route never enriches: it serves no check,
// Webacy or ScamSniffer data.

export const maxDuration = 10;

export async function GET(_request: NextRequest, props: GeneratedLabelRouteProps) {
  return handleGeneratedLabelRequest(props, 'spender', getPublicSpenderLabel);
}

const getPublicSpenderLabel = async (chainId: number, address: Address) => {
  return toPublicSpenderLabel(await getCuratedSpenderRows(chainId, address));
};
