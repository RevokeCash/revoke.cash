import { track } from '@amplitude/analytics-browser';
import { signERC2612Permit } from 'eth-permit';
import { Contract, Signer, utils } from 'ethers';
import { DAI_PERMIT } from 'lib/abis';
import { signDaiPermit } from './eth-permit';
import { unpackResult } from './promises';

export const permit = async (signer: Signer, contract: Contract, spender: string, value: string) => {
  const verifyingContract = contract.address;
  const address = await signer.getAddress();

  // We type this as 'any' because the signEIP2612Permit function only accepts "chainId"-style EIP-712 domains, not "salt"-style
  const domain = (await getPermitDomain(contract)) as any;

  const DAI_ADDRESSES = [
    '0x6B175474E89094C44Da98b954EedeAC495271d0F', // Ethereum
    '0x490e379C9cFF64944bE82b849F8FD5972C7999A7', // Polygon
  ];

  // DAI uses a different form of permit
  if (DAI_ADDRESSES.includes(verifyingContract)) {
    const { nonce, expiry, v, r, s } = await signDaiPermit(signer, domain, address, spender, false);
    const daiContract = new Contract(contract.address, DAI_PERMIT, signer);
    return daiContract.functions.permit(address, spender, nonce, expiry, false, v, r, s);
  }

  const { deadline, v, r, s } = await signERC2612Permit(signer, domain, address, spender, value);
  return contract.functions.permit(address, spender, value, deadline, v, r, s);
};

export const getPermitDomain = async (contract: Contract) => {
  const verifyingContract = contract.address;
  const version = getPermitDomainVersion(verifyingContract);

  const [chainId, name, symbol, domainSeparator] = await Promise.all([
    contract.provider.getNetwork().then((network) => network.chainId),
    unpackResult(contract.functions.name()),
    unpackResult(contract.functions.symbol()),
    unpackResult(contract.functions.DOMAIN_SEPARATOR()),
  ]);

  const salt = utils.hexZeroPad(utils.hexlify(chainId), 32);

  // Given the potential fields of a domain, we try to find the one that matches the domain separator
  const potentialDomains = [
    // Expected domain separators
    { name, version, chainId, verifyingContract },
    { name, version, verifyingContract, salt },
    { name: symbol, version, chainId, verifyingContract },
    { name: symbol, version, verifyingContract, salt },

    // Without version
    { name, chainId, verifyingContract },
    { name, verifyingContract, salt },
    { name: symbol, chainId, verifyingContract },
    { name: symbol, verifyingContract, salt },

    // Without name
    { version, chainId, verifyingContract },
    { version, verifyingContract, salt },

    // Without name or version
    { chainId, verifyingContract },
    { verifyingContract, salt },

    // With both chainId and salt
    { name, version, chainId, verifyingContract, salt },
    { name: symbol, version, chainId, verifyingContract, salt },
  ];

  const domain = potentialDomains.find((domain) => utils._TypedDataEncoder.hashDomain(domain) === domainSeparator);

  if (!domain) {
    // If the domain separator is something else, we cannot generate a valid signature
    track('Permit Domain Separator Mismatch', { name, verifyingContract, chainId });
    throw new Error('Could not determine Permit Signature data');
  }

  return domain;
};

export const getPermitDomainVersion = (verifyingContract: string) => {
  const knownDomainVersions: Record<string, string> = {
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': '2', // USDC on Ethereum
    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1': '2', // DAI on Arbitrum and Optimism (perhaps other chains too)
  };

  return knownDomainVersions[verifyingContract] ?? '1';
};
