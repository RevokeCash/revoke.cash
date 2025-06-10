'use client';

import { formatBalance, formatFiatBalance } from 'lib/utils/formatting';
import type { TokenData } from 'lib/utils/tokens';
import AssetDisplay from './AssetDisplay';

interface Props {
  asset: TokenData;
}

const AssetCell = ({ asset }: Props) => {
  const balanceText = formatBalance(asset.metadata.symbol, asset.balance, asset.metadata.decimals);
  const fiatBalanceText = formatFiatBalance(asset.balance, asset.metadata.price, asset.metadata.decimals);

  return (
    <div className="flex items-center gap-1 py-1 w-48 lg:w-56">
      <div className="flex flex-col items-start gap-0.5">
        <AssetDisplay asset={asset} />

        <div className="text-xs text-zinc-500 dark:text-zinc-400 flex gap-1 w-48 lg:w-56">
          <div className="truncate shrink">{balanceText}</div>
          {fiatBalanceText ? <div className="grow shrink-0">({fiatBalanceText})</div> : null}
        </div>
      </div>
    </div>
  );
};

export default AssetCell;
