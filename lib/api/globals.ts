import { ChainId } from '@revoke.cash/chains';
import {
  type DocumentedChainId,
  isBlockScoutSupportedChain,
  isCovalentSupportedChain,
  isCustomSupportedChain,
  isEtherscanSupportedChain,
  isHyperSyncSupportedChain,
  isNodeSupportedChain,
} from 'lib/utils/chains';
import { BlockScoutEventGetter } from './logs/BlockScoutEventGetter';
import { CovalentEventGetter } from './logs/CovalentEventGetter';
import { CustomEventGetter } from './logs/CustomEventGetter';
import { EtherscanEventGetter } from './logs/EtherscanEventGetter';
import type { EventGetter } from './logs/EventGetter';
import { HyperLiquidEventGetter } from './logs/HyperLiquidEventGetter';
import { HyperSyncEventGetter } from './logs/HyperSyncEventGetter';
import { NodeEventGetter } from './logs/NodeEventGetter';
import { TeloscanEventGetter } from './logs/TeloscanEventGetter';

// These variables should only get initiated once, which is why they live in their own file
// (would get initiated once per chain ID if in the /logs route file)

export const covalentEventGetter = new CovalentEventGetter(
  process.env.COVALENT_API_KEY,
  process.env.COVALENT_IS_PREMIUM === 'true',
);
export const etherscanEventGetter = new EtherscanEventGetter();
export const blockScoutEventGetter = new BlockScoutEventGetter();
export const nodeEventGetter = new NodeEventGetter(JSON.parse(process.env.NODE_URLS ?? '{}'));

export const hyperSyncEventGetter = new HyperSyncEventGetter();

export const customEventGetter = new CustomEventGetter({
  [ChainId.TelosEVMMainnet]: new TeloscanEventGetter(),
  // [999]: new ParsecEventGetter(),
  [999]: new HyperLiquidEventGetter(),
});

export const getEventGetter = (chainId: DocumentedChainId): EventGetter => {
  if (isHyperSyncSupportedChain(chainId)) {
    return hyperSyncEventGetter;
  }

  if (isCovalentSupportedChain(chainId)) {
    return covalentEventGetter;
  }

  if (isBlockScoutSupportedChain(chainId)) {
    return blockScoutEventGetter;
  }

  if (isEtherscanSupportedChain(chainId)) {
    return etherscanEventGetter;
  }

  if (isNodeSupportedChain(chainId)) {
    return nodeEventGetter;
  }

  if (isCustomSupportedChain(chainId)) {
    return customEventGetter;
  }

  throw new Error(`Unsupported chain ID: ${chainId}`);
};
