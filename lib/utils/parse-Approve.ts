import { ERC20_ABI, ERC721_ABI, PERMIT2_ABI } from 'lib/abis';
import { Log } from 'lib/interfaces';
import { decodeEventLog } from 'viem';

const ApprovalLogSelector = (log: Log, abi: typeof ERC721_ABI | typeof ERC20_ABI | typeof PERMIT2_ABI) => {
  try {
    const decodedLog = decodeEventLog({
      data: log.data,
      topics: log.topics,
      eventName: 'Approval',
      abi,
      strict: false,
    });
    return decodedLog.args;
  } catch (e) {
    console.log('error from Approval', e);
    return null;
  }
};

const ApprovalForAllLogSelector = (log: Log, abi: typeof ERC721_ABI | typeof ERC20_ABI | typeof PERMIT2_ABI) => {
  try {
    const decodedLog = decodeEventLog({
      data: log.data,
      topics: log.topics,
      eventName: 'ApprovalForAll',
      abi,
      strict: false,
    });
    return decodedLog.args;
  } catch (e) {
    console.log('error from ApprovalForAll', e);
    return null;
  }
};

const PermitApprovalLogSelector = (log: Log, abi: typeof PERMIT2_ABI | typeof ERC20_ABI | typeof ERC721_ABI) => {
  try {
    const decodedLog = decodeEventLog({
      data: log.data,
      topics: log.topics,
      eventName: 'Permit',
      abi,
      strict: false,
    });
    return decodedLog.args;
  } catch (e) {
    console.log('error from Permit', e);
    return null;
  }
};

export const parseLog = (log: Log) => {
  const eventSignature = log.topics[0];

  if (!eventSignature) {
    throw new Error('no');
  }

  const abis = [ERC20_ABI, ERC721_ABI];

  for (const abi of abis) {
    const approvalDecodedLogArgs = ApprovalLogSelector(log, abi);
    if (approvalDecodedLogArgs) {
      console.log('Approval', approvalDecodedLogArgs);
      return approvalDecodedLogArgs;
    }

    const approvalForALLDecodedLogArgs = ApprovalForAllLogSelector(log, abi);
    if (approvalForALLDecodedLogArgs) {
      console.log('Approval for All', approvalForALLDecodedLogArgs);
      return approvalForALLDecodedLogArgs;
    }

    const PermitDecodedLogArgs = PermitApprovalLogSelector(log, abi);
    if (PermitDecodedLogArgs) {
      console.log('Permit', PermitDecodedLogArgs);
      return PermitDecodedLogArgs;
    }
  }

  return null;
};
