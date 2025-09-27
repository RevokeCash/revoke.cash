import type { SpenderRiskData } from 'lib/interfaces';
import { isNullish } from 'lib/utils';
import { createViemPublicClientForChain } from 'lib/utils/chains';
import type { Address, Hex } from 'viem';
import type { SpenderDataSource } from '../SpenderDataSource';

const Addresses = {
  OPENSEA_SEAPORT: '0x1E0049783F008A0085193E00003D00cd54003c71',
  BLUR_MARKETPLACE: '0x00000000000111AbE46ff893f3B2fdF1F759a8A8',
  BLUR_MARKETPLACE_V2: '0x2f18F339620a63e43f0839Eeb18D7de1e1Be4DfB',
  X2Y2_MARKETPLACE: '0xF849de01B080aDC3A814FaBE1E2087475cF2E354',
  PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3',
};

export class OnchainSpenderRiskDataSource implements SpenderDataSource {
  async getSpenderData(address: Address, chainId: number): Promise<SpenderRiskData | null> {
    const publicClient = createViemPublicClientForChain(chainId);
    if (!publicClient) return null;

    try {
      const time = new Date().getTime();
      const [bytecode, nonce] = await Promise.all([
        publicClient.getCode({ address }),
        publicClient.getTransactionCount({ address }),
      ]);

      const riskFactors = [];

      if (this.isEOA(bytecode, nonce)) riskFactors.push({ type: 'eoa', source: 'onchain' });
      if (this.isUninitialized(bytecode, nonce)) riskFactors.push({ type: 'uninitialized', source: 'onchain' });
      // if (this.isSmallBytecode(bytecode)) riskFactors.push({ type: 'unsafe', source: 'revoke' });
      if (this.isOpenSeaProxy(bytecode)) riskFactors.push({ type: 'deprecated', source: 'onchain' });
      if (this.hasPhishingRisk(address, bytecode)) riskFactors.push({ type: 'phishing_risk', source: 'onchain' });
      if (this.isSuspiciousAddress(address)) riskFactors.push({ type: 'suspicious_address', source: 'onchain' });
      if (this.isCrimeEnjoyor(bytecode)) riskFactors.push({ type: 'blocklist', source: 'onchain' });

      const elapsedTime = (new Date().getTime() - time) / 1000;
      console.log(elapsedTime, 'Onchain', address);

      if (this.isOpenSeaProxy(bytecode)) {
        return { name: 'OpenSea (old)', riskFactors };
      }

      if (this.isCrimeEnjoyor(bytecode)) {
        return { name: 'Scam Delegate', riskFactors };
      }

      return riskFactors.length > 0 ? { riskFactors } : null;
    } catch {
      return null;
    }
  }

  isEOA(bytecode: Hex | undefined, nonce: number): boolean {
    // EIP7702 accounts are also EOA's but their bytecode is set to 0xef0100..., so we need to check for that first
    if (this.isEip7702Account(bytecode)) return true;

    return isNullish(bytecode) && nonce > 0;
  }

  isUninitialized(bytecode: Hex | undefined, nonce: number): boolean {
    return isNullish(bytecode) && nonce === 0;
  }

  isSmallBytecode(bytecode?: Hex): boolean {
    return !isNullish(bytecode) && bytecode.length > 0 && bytecode.length < 1000;
  }

  isEip7702Account(bytecode?: Hex): boolean {
    return !isNullish(bytecode) && bytecode.startsWith('0xef0100') && bytecode.length === 48;
  }

  hasPhishingRisk(address: Address, bytecode?: Hex): boolean {
    // TODO: Add more addresses also for other chains
    const PHISHING_RISK_ADDRESSES = [
      Addresses.OPENSEA_SEAPORT,
      Addresses.BLUR_MARKETPLACE,
      Addresses.BLUR_MARKETPLACE_V2,
      Addresses.X2Y2_MARKETPLACE,
      Addresses.PERMIT2,
    ];

    return PHISHING_RISK_ADDRESSES.includes(address) || this.isOpenSeaProxy(bytecode);
  }

  isOpenSeaProxy(bytecode?: Hex): boolean {
    const OPENSEA_PROXY_BYTECODE =
      '0x6080604052600436106100825763ffffffff7c0100000000000000000000000000000000000000000000000000000000600035041663025313a281146100c85780633659cfe6146100f95780634555d5c91461011c5780634f1ef286146101435780635c60da1b1461019d5780636fde8202146101b2578063f1739cae146101c7575b600061008c6101e8565b9050600160a060020a03811615156100a357600080fd5b60405136600082376000803683855af43d806000843e8180156100c4578184f35b8184fd5b3480156100d457600080fd5b506100dd6101f7565b60408051600160a060020a039092168252519081900360200190f35b34801561010557600080fd5b5061011a600160a060020a0360043516610206565b005b34801561012857600080fd5b50610131610239565b60408051918252519081900360200190f35b60408051602060046024803582810135601f810185900485028601850190965285855261011a958335600160a060020a031695369560449491939091019190819084018382808284375094975061023e9650505050505050565b3480156101a957600080fd5b506100dd6101e8565b3480156101be57600080fd5b506100dd6102f2565b3480156101d357600080fd5b5061011a600160a060020a0360043516610301565b600054600160a060020a031690565b60006102016102f2565b905090565b61020e6101f7565b600160a060020a031633600160a060020a031614151561022d57600080fd5b61023681610391565b50565b600290565b6102466101f7565b600160a060020a031633600160a060020a031614151561026557600080fd5b61026e82610206565b30600160a060020a03168160405180828051906020019080838360005b838110156102a357818101518382015260200161028b565b50505050905090810190601f1680156102d05780820380516001836020036101000a031916815260200191505b50915050600060405180830381855af491505015156102ee57600080fd5b5050565b600154600160a060020a031690565b6103096101f7565b600160a060020a031633600160a060020a031614151561032857600080fd5b600160a060020a038116151561033d57600080fd5b7f5a3e66efaa1e445ebd894728a69d6959842ea1e97bd79b892797106e270efcd96103666101f7565b60408051600160a060020a03928316815291841660208301528051918290030190a161023681610401565b600054600160a060020a03828116911614156103ac57600080fd5b6000805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a038316908117825560405190917fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b91a250565b6001805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a03929092169190911790555600a165627a7a723058205f26049bbc794226b505f589b2ee1130db54310d79dd8a635c6f6c61e305a7770029';
    return bytecode === OPENSEA_PROXY_BYTECODE;
  }

  // Legitimate apps can sometimes have 0000 prefixes as an optimisation, but never end with 0000 as well
  isSuspiciousAddress(address: Address): boolean {
    return address.startsWith('0x0000') && address.endsWith('0000');
  }

  isCrimeEnjoyor(bytecode?: Hex): boolean {
    const CRIME_ENJOYOR_BYTECODE =
      '0x60806040526004361061002c575f3560e01c8063b269681d14610126578063c4d66de81461015057610122565b36610122575f73ffffffffffffffffffffffffffffffffffffffff165f8054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16036100be576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100b5906102a5565b60405180910390fd5b5f8054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff166108fc3490811502906040515f60405180830381858888f19350505050158015610120573d5f803e3d5ffd5b005b5f80fd5b348015610131575f80fd5b5061013a610178565b6040516101479190610302565b60405180910390f35b34801561015b575f80fd5b5061017660048036038101906101719190610349565b61019b565b005b5f8054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b5f73ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1603610209576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610200906103be565b60405180910390fd5b805f806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b5f82825260208201905092915050565b7f4e6f7420696e697469616c697a656400000000000000000000000000000000005f82015250565b5f61028f600f8361024b565b915061029a8261025b565b602082019050919050565b5f6020820190508181035f8301526102bc81610283565b9050919050565b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f6102ec826102c3565b9050919050565b6102fc816102e2565b82525050565b5f6020820190506103155f8301846102f3565b92915050565b5f80fd5b610328816102e2565b8114610332575f80fd5b50565b5f813590506103438161031f565b92915050565b5f6020828403121561035e5761035d61031b565b5b5f61036b84828501610335565b91505092915050565b7f496e76616c69642064657374696e6174696f6e000000000000000000000000005f82015250565b5f6103a860138361024b565b91506103b382610374565b602082019050919050565b5f6020820190508181035f8301526103d58161039c565b905091905056fea26469706673582212201529cbf2ecb5da97e8cf7369bb9c7db3a5b404a21dc91bdf63e891ef7e93202e64736f6c63430008180033';

    return bytecode === CRIME_ENJOYOR_BYTECODE;
  }

  // TODO: Add checker that gets recent approval / revoke logs and checks if many people are approving / revoking this address
  // - First needs the Approval event log normalisation
  // - Also needs registration of average block times for every supported chain
}
