import { getChainExplorerUrl } from '@revoke.cash/core/chains';
import { shortenAddress } from '@revoke.cash/core/utils/formatting';
import type { SpenderData, SpenderRiskData } from '@revoke.cash/core/whois';
import CopyButton from 'components/common/CopyButton';
import Href from 'components/common/Href';
import WithHoverTooltip from 'components/common/WithHoverTooltip';
import type { Address } from 'viem';
import RiskTooltip from '../wallet-health/RiskTooltip';

interface Props {
  address: Address;
  spenderData?: SpenderData | SpenderRiskData;
  chainId: number;
}

const AddressCell = ({ address, spenderData, chainId }: Props) => {
  const explorerUrl = `${getChainExplorerUrl(chainId)}/address/${address}`;

  return (
    <div className="flex items-center gap-2 max-w-52">
      <div className="flex flex-col justify-start items-start">
        <WithHoverTooltip tooltip={<span className="font-mono">{address}</span>}>
          <Href href={explorerUrl} underline="hover" external>
            <div className="max-w-40 truncate">{spenderData?.name ?? shortenAddress(address, 6)}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              {spenderData?.name ? shortenAddress(address, 6) : null}
            </div>
          </Href>
        </WithHoverTooltip>
      </div>
      <CopyButton content={address} className="text-zinc-500 dark:text-zinc-400" />
      <RiskTooltip riskFactors={spenderData?.riskFactors ?? undefined} />
    </div>
  );
};

export default AddressCell;
