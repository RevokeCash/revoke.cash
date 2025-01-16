import { expect } from 'chai';
import { SupportType } from 'lib/chains/Chain';
import { ALCHEMY_API_KEY, INFURA_API_KEY } from 'lib/constants';
import {
  DEFAULT_DONATION_AMOUNTS,
  ORDERED_CHAINS,
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
  getChainRpcUrl,
  getChainSlug,
  getCorrespondingMainnetChainId,
  getDefaultDonationAmount,
} from 'lib/utils/chains';
import networkDescriptions from 'locales/en/networks.json' with { type: 'json' };

describe('Chain Support', () => {
  it('should not have superfluous default donation amounts', () => {
    const nativeTokensWithAmounts = Object.keys(DEFAULT_DONATION_AMOUNTS);
    const supportedChainNativeTokens = ORDERED_CHAINS.map(getChainNativeToken);
    nativeTokensWithAmounts.forEach((token) => {
      expect(supportedChainNativeTokens).to.include(token);
    });
  });

  ORDERED_CHAINS.forEach((chainId) => {
    const chainName = getChainName(chainId);
    const nativeToken = getChainNativeToken(chainId)!;

    describe(`${chainName} (${nativeToken})`, () => {
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
        expect(getDefaultDonationAmount(nativeToken), `${chainName} default donation amount`).to.exist;
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
      });
    });
  });
});

// biome-ignore lint/complexity/noUselessEmptyExport lint/suspicious/noExportsInTest: Cypress somehow wants this
export {};
