import ky from 'lib/ky';
import { type TokenData, ownsAnyOf } from 'lib/utils/tokens';

export const canMint = (ownedOrAllowedTokens: TokenData[]) => {
  const PUDGY_PENGUINS_ADDRESS = '0xBd3531dA5CF5857e7CfAA92426877b022e612cf8';
  const LIL_PUDGYS_ADDRESS = '0x524cAB2ec69124574082676e6F654a18df49A048';
  const PUDGY_ROGS_ADDRESS = '0x062E691c2054dE82F28008a8CCC6d7A1c8ce060D';
  return ownsAnyOf(ownedOrAllowedTokens, [PUDGY_PENGUINS_ADDRESS, LIL_PUDGYS_ADDRESS, PUDGY_ROGS_ADDRESS]);
};

// TODO: Check if we already own the SBT
export const alreadyOwnsSoulboundToken = (ownedOrAllowedTokens: TokenData[]) => {
  return false;
  // const SBT_ADDRESS = '0x0000000000000000000000000000000000000000'; // TODO
  // return ownsAnyOf(ownedOrAllowedTokens, [SBT_ADDRESS]);
};

export const checkIfAlreadyClaimedInCache = async (address: string) => {
  const response = await ky.post('/api/pudgy/check-cache', { json: { address } }).json<{ claimed: boolean }>();
  return response.claimed;
};
