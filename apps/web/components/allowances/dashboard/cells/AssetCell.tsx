'use client';

import { isErc721, type TokenData } from '@revoke.cash/core/tokens';
import { isNullish } from '@revoke.cash/core/utils';
import { formatBalance, formatFiatBalance } from '@revoke.cash/core/utils/formatting';
import Loader from 'components/common/Loader';
import AssetDisplay from './AssetDisplay';

interface Props {
  asset: TokenData;
}

const AssetCell = ({ asset }: Props) => {
  if (isErc721(asset.token)) {
    return (
      <div className="flex items-center gap-1 py-1 w-48 lg:w-56 h-12">
        <AssetDisplay asset={asset} />
      </div>
    );
  }

  const isBalanceLoading = isNullish(asset.balance);
  const balanceText = formatBalance(asset.metadata.symbol, asset.balance, asset.metadata.decimals);
  const fiatBalanceText = formatFiatBalance(asset.balance, asset.metadata.price, asset.metadata.decimals);

  return (
    <div className="flex items-center gap-1 py-1 w-48 lg:w-56 h-12">
      <div className="flex flex-col items-start gap-0.5">
        <AssetDisplay asset={asset} />

        <div className="text-xs text-zinc-500 dark:text-zinc-400 flex gap-1 w-48 lg:w-56">
          {isBalanceLoading ? (
            <Loader isLoading className="h-4 w-24 rounded-sm" />
          ) : (
            <>
              <div className="truncate shrink">{balanceText}</div>
              {fiatBalanceText ? <div className="grow shrink-0">({fiatBalanceText})</div> : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssetCell;
