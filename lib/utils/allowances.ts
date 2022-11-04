import {
  isERC20Allowance,
  isERC20Token,
  isERC721Allowance,
  isERC721Token,
  ITokenAllowance,
  TokenData,
} from 'lib/interfaces';
import { formatAllowance } from './erc20';

export const getAllowanceI18nValues = (allowance: ITokenAllowance, token: TokenData, updatedAmount?: string) => {
  if (isERC20Allowance(allowance) && isERC20Token(token)) {
    const amount = formatAllowance(updatedAmount ?? allowance.amount, token.decimals, token.totalSupply);
    const i18nKey = amount === 'Unlimited' ? 'dashboard:allowance_unlimited' : 'dashboard:allowance';
    return { amount, i18nKey };
  } else if (isERC721Allowance(allowance) && isERC721Token(token)) {
    const { tokenId } = allowance;
    const i18nKey = tokenId === undefined ? 'dashboard:allowance_unlimited' : 'dashboard:allowance_token_id';
    return { tokenId, i18nKey };
  }
};
