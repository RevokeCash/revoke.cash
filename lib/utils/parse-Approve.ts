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
        return {
          type: 'Approval',
          owner: args[0],
          spender: args[1],
          value: args[2]?.toString(),
        };
      } else if (decodedLog.name === 'ApprovalForAll') {
        return {
          type: 'ApprovalForAll',
          owner: args[0],
          operator: args[1],
          approved: args[2],
        };
      } else if (decodedLog.name === 'Permit2Approval') {
        return {
          type: 'Permit2Approval',
          owner: args[0],
          spender: args[1],
          value: args[2]?.toString(),
        };
      }
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  return null;
};
