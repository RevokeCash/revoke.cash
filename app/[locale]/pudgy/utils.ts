import { type TokenData, ownsAnyOf } from 'lib/utils/tokens';

export const canMint = (ownedOrAllowedTokens: TokenData[]) => {
  const PUDGY_PENGUINS_ADDRESS = '0xBd3531dA5CF5857e7CfAA92426877b022e612cf8';
  const LIL_PUDGYS_ADDRESS = '0x524cAB2ec69124574082676e6F654a18df49A048';
  const PUDGY_ROGS_ADDRESS = '0x062E691c2054dE82F28008a8CCC6d7A1c8ce060D';
  return ownsAnyOf(ownedOrAllowedTokens, [PUDGY_PENGUINS_ADDRESS, LIL_PUDGYS_ADDRESS, PUDGY_ROGS_ADDRESS]);
};
