import { ERC20_ABI, ERC721_ABI, PERMIT2_ABI } from 'lib/abis';
import { DecodedEventLog, Log, ParsedEvent } from 'lib/interfaces';
import { decodeEventLog } from 'viem';

export const parseLog = (log: Log): ParsedEvent | null => {
  const abis = [ERC20_ABI, ERC721_ABI, PERMIT2_ABI];

  for (const abi of abis) {
    try {
      const decodedLog = decodeEventLog({
        abi: abi,
        data: log.data,
        topics: log.topics,
      }) as DecodedEventLog;

      const args = decodedLog.args;

      if (decodedLog.name === 'Approval') {
        if (abi === ERC721_ABI) {
          // ERC721 Approval
          return {
            type: 'Approval',
            owner: args[0],
            spender: args[2],
            tokenId: args[3]?.toString(),
          };
        } else if (abi === PERMIT2_ABI) {
          // Permit2 Approval
          return {
            type: 'Approval',
            owner: args[0],
            token: args[1],
            spender: args[2],
            amount: args[3]?.toString(),
            expiration: args[4]?.toString(),
          };
        } else {
          // ERC20 Approval
          return {
            type: 'Approval',
            owner: args[0],
            spender: args[1],
            value: args[2]?.toString(),
          };
        }
      } else if (decodedLog.name === 'ApprovalForAll') {
        return {
          type: 'ApprovalForAll',
          owner: args[0],
          spender: args[1],
          approved: args[2],
        };
      } else if (decodedLog.name === 'Permit') {
        return {
          type: 'Permit',
          owner: args[0],
          token: args[1],
          spender: args[2],
          amount: args[3]?.toString(),
          expiration: args[4]?.toString(),
          nonce: args[5]?.toString(),
        };
      }
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  return null;
};
