import { ERC20_ABI, ERC721_ABI, PERMIT2_ABI } from 'lib/abis';
import { DecodedEventLog, Log, ParsedEvent } from 'lib/interfaces';
import { decodeEventLog } from 'viem';

// Keccak-256 hash of event signatures Hard coded for testing
const eventSignatureMap: { [signatureHash: string]: { name: string; abis: any[] } } = {
  '0x8c5be1e5': { name: 'Approval', abis: [ERC20_ABI, ERC721_ABI, PERMIT2_ABI] },
  '0x17307eab': { name: 'ApprovalForAll', abis: [ERC721_ABI] },
  '0xd505accf': { name: 'Permit', abis: [PERMIT2_ABI] },
};

export const parseLog = (log: Log): ParsedEvent | null => {
  const eventSignature = log.topics[0];

  const eventInfo = eventSignatureMap[eventSignature];

  if (!eventInfo) {
    return null; // Unknown event
  }

  const { name, abis } = eventInfo;

  for (const abi of abis) {
    try {
      const decodedLog = decodeEventLog({
        abi: abi,
        data: log.data,
        topics: log.topics,
      }) as DecodedEventLog;

      const args = decodedLog.args;

      switch (name) {
        case 'Approval':
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
        case 'ApprovalForAll':
          return {
            type: 'ApprovalForAll',
            owner: args[0],
            spender: args[1],
            approved: args[2],
          };
        case 'Permit':
          return {
            type: 'Permit',
            owner: args[0],
            token: args[1],
            spender: args[2],
            amount: args[3]?.toString(),
            expiration: args[4]?.toString(),
            nonce: args[5]?.toString(),
          };
        default:
          break;
      }
    } catch (e) {
      console.error('Error decoding log:', e);
    }
  }

  return null;
};
