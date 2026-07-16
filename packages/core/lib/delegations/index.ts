import { isNullish } from '@revoke.cash/core/utils';
import type { Delegation } from './DelegatePlatform';

export const delegationEquals = (a: Delegation, b: Delegation): boolean => {
  // Handle null/undefined cases
  if (isNullish(a) || isNullish(b)) return false;
  if (isNullish(a.delegator) || isNullish(a.delegate)) return false;
  if (isNullish(b.delegator) || isNullish(b.delegate)) return false;

  return (
    a.delegator === b.delegator &&
    a.delegate === b.delegate &&
    a.type === b.type &&
    a.contract === b.contract &&
    a.tokenId === b.tokenId &&
    a.platform === b.platform &&
    a.direction === b.direction &&
    (a as any).rights === (b as any).rights
  );
};
