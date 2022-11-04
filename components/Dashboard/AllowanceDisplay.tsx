import { useEthereum } from 'lib/hooks/useEthereum';
import { ITokenAllowance, TokenData } from 'lib/interfaces';
import { shortenAddress } from 'lib/utils';
import { getAllowanceI18nValues } from 'lib/utils/allowances';
import { getChainExplorerUrl } from 'lib/utils/chains';
import Trans from 'next-translate/Trans';
import { Form } from 'react-bootstrap';

interface Props {
  allowance: ITokenAllowance;
  token: TokenData;
  updatedAmount?: string;
  spenderName?: string;
}

function AllowanceDisplay({ allowance, token, updatedAmount, spenderName }: Props) {
  const { selectedChainId } = useEthereum();

  const spenderDisplay = spenderName || allowance.spender;
  const shortenedSpenderDisplay = spenderName || shortenAddress(allowance.spender);
  const { i18nKey, amount, tokenId } = getAllowanceI18nValues(allowance, token, updatedAmount);
  const explorerUrl = `${getChainExplorerUrl(selectedChainId)}/address/${allowance.spender}`;

  return (
    // Display separate spans for the regular and shortened versions of the spender address
    // The correct one is selected using CSS media-queries
    <Form.Label className="AllowanceText">
      <span className="only-mobile-inline">
        <Trans
          i18nKey={i18nKey}
          values={{ amount, tokenId, spender: shortenedSpenderDisplay }}
          components={[<a className="monospace" href={explorerUrl} />]}
        />
      </span>
      <span className="only-desktop-inline">
        <Trans
          i18nKey={i18nKey}
          values={{ amount, tokenId, spender: spenderDisplay }}
          components={[<a className="monospace" href={explorerUrl} />]}
        />
      </span>
    </Form.Label>
  );
}

export default AllowanceDisplay;
