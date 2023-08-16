import { call, RSV, signData } from 'eth-permit/dist/rpc';

// eth-permit does not support "revoking" DAI Permits, so this file contains a modified version of the signDaiPermit function

const MAX_INT = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
const NONCES_FN = '0x7ecebe00';

interface Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string;
}

interface DaiPermitMessage {
  holder: string;
  spender: string;
  nonce: number;
  expiry: number | string;
  allowed?: boolean;
}

const zeros = (numZeros: number) => ''.padEnd(numZeros, '0');

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

const createTypedDaiData = (message: DaiPermitMessage, domain: Domain) => {
  const typedData = {
    types: {
      EIP712Domain,
      Permit: [
        { name: 'holder', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'nonce', type: 'uint256' },
        { name: 'expiry', type: 'uint256' },
        { name: 'allowed', type: 'bool' },
      ],
    },
    primaryType: 'Permit',
    domain,
    message,
  };

  return typedData;
};

export const signDaiPermit = async (
  provider: any,
  domain: Domain,
  holder: string,
  spender: string,
  allowed: boolean = true,
  expiry?: number,
  nonce?: number,
): Promise<DaiPermitMessage & RSV> => {
  const tokenAddress = domain.verifyingContract;

  const message: DaiPermitMessage = {
    holder,
    spender,
    nonce:
      nonce === undefined ? await call(provider, tokenAddress, `${NONCES_FN}${zeros(24)}${holder.substr(2)}`) : nonce,
    expiry: expiry || MAX_INT,
    allowed,
  };

  const typedData = createTypedDaiData(message, domain);
  const sig = await signData(provider, holder, typedData);

  return { ...sig, ...message };
};
