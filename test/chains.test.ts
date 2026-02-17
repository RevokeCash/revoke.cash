import { ChainId } from '@revoke.cash/chains';
import { expect } from 'chai';
import { TEST_ADDRESSES } from 'cypress/support/chain-fixtures';
import { ERC20_ABI } from 'lib/abis';
import { SupportType } from 'lib/chains/Chain';
import { ALCHEMY_API_KEY, DRPC_API_KEY, INFURA_API_KEY } from 'lib/constants';
import { getScriptLogsProvider } from 'lib/ScriptLogsProvider';
import { addressToTopic } from 'lib/utils';
import {
  createViemPublicClientForChain,
  getChainApiUrl,
  getChainConfig,
  getChainExplorerUrl,
  getChainFreeRpcUrl,
  getChainIdFromSlug,
  getChainInfoUrl,
  getChainLogo,
  getChainLogsRpcUrl,
  getChainName,
  getChainNativeToken,
  getChainNativeTokenCoingeckoId,
  getChainRpcUrl,
  getChainSlug,
  getCorrespondingMainnetChainId,
  ORDERED_CHAINS,
  SUPPORTED_CHAINS,
} from 'lib/utils/chains';
import networkDescriptions from 'locales/en/networks.json' with { type: 'json' };
import { getAbiItem, toEventSelector } from 'viem';

const extended = process.env.EXTENDED !== 'false';

const itExtended = extended ? it : it.skip;

describe(extended ? 'Chain Support (Extended)' : 'Chain Support', () => {
  it('should have a Mocha and Cypress test for every supported chain', () => {
    const SORTED_SUPPORTED_CHAINS = [...SUPPORTED_CHAINS].sort();
    const SORTED_DROPDOWN_CHAINS = [...ORDERED_CHAINS].sort();
    const SORTED_TEST_CHAINS = Object.keys(TEST_ADDRESSES).map(Number).sort();

    expect(SORTED_SUPPORTED_CHAINS).to.deep.equal(SORTED_DROPDOWN_CHAINS);
    expect(SORTED_TEST_CHAINS).to.deep.equal(SORTED_DROPDOWN_CHAINS);
  });

  it('should not have superfluous network descriptions', () => {
    const descriptionSlugs = Object.keys(networkDescriptions.networks).toSorted();

    const expectedSlugs = ORDERED_CHAINS.map((chainId) => {
      const correspondingMainnetChainId = getCorrespondingMainnetChainId(chainId);
      return correspondingMainnetChainId ? getChainSlug(correspondingMainnetChainId) : getChainSlug(chainId);
    });

    expect(descriptionSlugs).to.deep.equal([...new Set(expectedSlugs)].toSorted());
  });

  ORDERED_CHAINS.forEach((chainId) => {
    const chainName = getChainName(chainId);
    const chainType = getChainConfig(chainId)?.type;
    const nativeToken = getChainNativeToken(chainId)!;
    const logsProvider = getScriptLogsProvider(chainId);

    describe(`${chainName} (${chainId}) -- ${chainType}`, () => {
      it('should have base chain data', () => {
        expect(getChainName(chainId), `${chainName} name`).to.exist;
        expect(getChainLogo(chainId), `${chainName} logo`).to.exist;
        expect(getChainInfoUrl(chainId), `${chainName} info url`).to.exist;
        expect(getChainExplorerUrl(chainId), `${chainName} explorer url`).to.exist;
        expect(getChainRpcUrl(chainId), `${chainName} rpc url`).to.exist;
        expect(getChainLogsRpcUrl(chainId), `${chainName} logs rpc url`).to.exist;
        expect(getChainFreeRpcUrl(chainId), `${chainName} free rpc url`).to.exist;
        expect(getChainSlug(chainId), `${chainName} slug`).to.exist;
        expect(getChainIdFromSlug(getChainSlug(chainId)), `${chainName} chain id from slug`).to.equal(chainId);
        expect(nativeToken, `${chainName} native token`).to.exist;

        const NO_PRICING: number[] = [ChainId.ZenChainTestnet];

        if (!NO_PRICING.includes(chainId)) {
          expect(getChainNativeTokenCoingeckoId(chainId), `${chainName} native token coingecko id`).to.exist;
        }
      });

      if (getChainConfig(chainId)?.type === SupportType.ETHERSCAN_COMPATIBLE) {
        it('should have an Etherscan API URL', () => {
          expect(getChainApiUrl(chainId)).to.exist;
        });
      }

      it('should have a description', () => {
        const mainnetChainId = getCorrespondingMainnetChainId(chainId) ?? chainId;
        expect((networkDescriptions.networks as Record<string, string>)[getChainSlug(mainnetChainId)]).to.exist;
      });

      it('should have the correct chain ID for the main RPC', async () => {
        const client = createViemPublicClientForChain(chainId, getChainRpcUrl(chainId))!;
        expect(await client.getChainId()).to.equal(chainId);
      });

      if (getChainRpcUrl(chainId) !== getChainLogsRpcUrl(chainId)) {
        it('should have the correct chain ID for the logs RPC', async () => {
          const client = createViemPublicClientForChain(chainId, getChainLogsRpcUrl(chainId))!;
          expect(await client.getChainId()).to.equal(chainId);
        });
      }

      if (getChainRpcUrl(chainId) !== getChainFreeRpcUrl(chainId)) {
        it('should have the correct chain ID for the free RPC', async () => {
          const client = createViemPublicClientForChain(chainId, getChainFreeRpcUrl(chainId))!;
          expect(await client.getChainId()).to.equal(chainId);
        });
      }

      it('should not expose API keys in the free RPC URL', () => {
        INFURA_API_KEY && expect(getChainFreeRpcUrl(chainId)).to.not.include(INFURA_API_KEY);
        ALCHEMY_API_KEY && expect(getChainFreeRpcUrl(chainId)).to.not.include(ALCHEMY_API_KEY);
        DRPC_API_KEY && expect(getChainFreeRpcUrl(chainId)).to.not.include(DRPC_API_KEY);
      });

      itExtended('can retrieve latest block number', async () => {
        const blockHeight = await logsProvider.getLatestBlock();
        expect(blockHeight).to.exist;
      });

      // This test is a simplified version of the Cypress tests, since logs retrieval is the most likely to fail
      itExtended('can retrieve approval event logs for full blockchain history', async () => {
        const fixtureAddress = TEST_ADDRESSES[chainId];
        const blockHeight = await logsProvider.getLatestBlock();
        const filter = {
          fromBlock: 0,
          toBlock: blockHeight,
          topics: [toEventSelector(getAbiItem({ abi: ERC20_ABI, name: 'Approval' })), addressToTopic(fixtureAddress)],
        };

        const logs = await logsProvider.getLogs(filter);
        expect(logs).to.exist;
        expect(logs.length).to.be.greaterThan(0);
      });
    });
  });
});

// biome-ignore lint/complexity/noUselessEmptyExport lint/suspicious/noExportsInTest: Cypress somehow wants this
export {};
