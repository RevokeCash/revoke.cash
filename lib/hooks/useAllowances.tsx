import { IERC20Allowance, IERC721Allowance, isERC721Token, ITokenAllowance, TokenData } from 'lib/interfaces';
import { compareBN } from 'lib/utils';
import {
  formatErc20Allowance,
  getErc20AllowancesFromApprovals,
  getLimitedErc721AllowancesFromApprovals,
  getUnlimitedErc721AllowancesFromApprovals,
} from 'lib/utils/allowances';
import { useEffect, useState } from 'react';
import { useAppContext } from './useAppContext';

export const useAllowances = (token: TokenData) => {
  const { inputAddress } = useAppContext();
  const [allowances, setAllowances] = useState<ITokenAllowance[]>([]);
  const [loading, setLoading] = useState<boolean>();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      if (isERC721Token(token)) {
        const unlimitedAllowances = await getUnlimitedErc721AllowancesFromApprovals(
          token.contract,
          inputAddress,
          token.approvalsForAll
        );
        const limitedAllowances = await getLimitedErc721AllowancesFromApprovals(token.contract, token.approvals);
        const allAllowances = [...limitedAllowances, ...unlimitedAllowances].filter(
          (allowance) => allowance !== undefined
        );

        setAllowances(allAllowances);
      } else {
        // Filter out zero-value allowances and sort from high to low
        const loadedAllowances = (await getErc20AllowancesFromApprovals(token.contract, inputAddress, token.approvals))
          .filter(({ amount }) => formatErc20Allowance(amount, token.decimals, token.totalSupply) !== '0.000')
          .sort((a, b) => -1 * compareBN(a.amount, b.amount));

        setAllowances(loadedAllowances);
      }

      setLoading(false);
    };

    loadData();
  }, []);

  if (isERC721Token(token)) {
    const onRevoke = (allowance: IERC721Allowance) => {
      const allowanceEquals = (a: IERC721Allowance, b: IERC721Allowance) =>
        a.spender === b.spender && a.tokenId === b.tokenId;

      setAllowances((previousAllowances) => previousAllowances.filter((other) => !allowanceEquals(other, allowance)));
    };

    return { allowances, loading, onRevoke };
  } else {
    const onRevoke = (allowance: IERC20Allowance) => {
      setAllowances((previousAllowances) => previousAllowances.filter((other) => other.spender !== allowance.spender));
    };

    return { allowances, loading, onRevoke };
  }
};
