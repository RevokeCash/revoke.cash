import { ChainId } from '@revoke.cash/chains';
import { writeFileSync } from 'fs';
import { getChainRpcUrl } from 'lib/utils/chains';
import { join } from 'path';

// Nobody knows why Ledger has these currency codes
const currencyMap = {
  [ChainId.EthereumMainnet]: 'ethereum',
  [ChainId.BNBSmartChainMainnet]: 'bsc',
  [ChainId.ArbitrumOne]: 'arbitrum',
  [ChainId.OPMainnet]: 'optimism',
  [ChainId.Base]: 'base',
  [ChainId.FantomOpera]: 'fantom',
  [ChainId.PolygonMainnet]: 'polygon',
};

const manifest = {
  id: 'revoke',
  name: 'Revoke.cash',
  url: 'https://revoke.cash',
  dapp: {
    nanoApp: 'Ethereum',
    // Ledger Live only supports Ethereum, BNB Chain, Arbitrum, Optimism, Base, Fantom and Polygon
    networks: [
      ChainId.EthereumMainnet,
      ChainId.BNBSmartChainMainnet,
      ChainId.ArbitrumOne,
      ChainId.OPMainnet,
      ChainId.Base,
      ChainId.FantomOpera,
      ChainId.PolygonMainnet,
    ].map((chainId) => ({
      chainID: chainId,
      currency: currencyMap[chainId],
      nodeURL: getChainRpcUrl(chainId),
    })),
  },
  homepageUrl: 'https://revoke.cash',
  icon: 'https://revoke.cash/assets/images/android-chrome-512x512.png',
  platform: 'all',
  apiVersion: '^2.0.0',
  manifestVersion: '2',
  branch: 'stable',
  categories: ['defi', 'security'],
  currencies: [],
  content: {
    shortDescription: {
      en: 'Revoke token approvals you granted on Ethereum and over 100 other networks.',
    },
    description: {
      en: 'Take back control of your wallet and stay safe by revoking token approvals you granted on Ethereum and over 100 other networks.',
    },
  },
  permissions: [],
  domains: ['https://'],
};

writeFileSync(join(__dirname, 'ledger-live-manifest.json'), JSON.stringify(manifest, null, 2));
