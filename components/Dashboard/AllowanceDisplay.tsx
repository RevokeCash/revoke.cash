import { useEthereum } from 'lib/hooks/useEthereum';
import type { ITokenAllowance, TokenData } from 'lib/interfaces';
import { shortenAddress } from 'lib/utils';
import { getAllowanceI18nValues } from 'lib/utils/allowances';
import { getChainExplorerUrl } from 'lib/utils/chains';
import Trans from 'next-translate/Trans';

interface Props {
  allowance: ITokenAllowance;
  token: TokenData;
  updatedAmount?: string;
  spenderName?: string;
}

const AllowanceDisplay = ({ allowance, token, updatedAmount, spenderName }: Props) => {
  const { selectedChainId } = useEthereum();

  const spender = spenderName || shortenAddress(allowance.spender);
  const { i18nKey, amount, tokenId } = getAllowanceI18nValues(allowance, token, updatedAmount);
  const explorerUrl = `${getChainExplorerUrl(selectedChainId)}/address/${allowance.spender}`;

  return (
    <div>
      <Trans
        i18nKey={i18nKey}
        values={{ amount, tokenId, spender }}
        components={[<a className="monospace" href={explorerUrl} />]}
      />
    </div>
  );
};

export default AllowanceDisplay;
