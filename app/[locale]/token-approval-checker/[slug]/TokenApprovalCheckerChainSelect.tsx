'use client';

import ChainSelectHref from 'components/common/select/ChainSelectHref';
import { getChainSlug } from 'lib/utils/chains';

interface Props {
  chainId: number;
}

// This is a wrapper around ChainSelectHref because we cannot pass the getUrl function as a prop from a server component
const TokenApprovalCheckerChainSelect = ({ chainId }: Props) => {
  return (
    <ChainSelectHref
      instanceId="tac-chain-select"
      selected={chainId}
      getUrl={(chainId) => `/token-approval-checker/${getChainSlug(chainId)}`}
      showNames
    />
  );
};

export default TokenApprovalCheckerChainSelect;
