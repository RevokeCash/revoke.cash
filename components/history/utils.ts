import type { ApprovalTokenEvent } from 'lib/utils/events';
import type { TokenMetadata } from 'lib/utils/tokens';

// TODO: Properly account for "old spender" for ERC721_APPROVAL revoke events
export type ApprovalHistoryEvent = ApprovalTokenEvent & { metadata: TokenMetadata };
