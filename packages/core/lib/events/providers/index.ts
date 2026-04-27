import { getChainLogsRpcUrl, isBackendSupportedChain } from '@revoke.cash/core/chains';
import { DivideAndConquerLogsProvider } from './DivideAndConquerLogsProvider';
import type { LogsProvider } from './LogsProvider';
import { ScriptLogsProvider } from './ScriptLogsProvider';
import { ViemLogsProvider } from './ViemLogsProvider';

export { DatabaseLogsProvider } from './DatabaseLogsProvider';
export { DivideAndConquerLogsProvider } from './DivideAndConquerLogsProvider';
export type { LogsProvider } from './LogsProvider';
export { ScriptLogsProvider } from './ScriptLogsProvider';
export { ViemLogsProvider } from './ViemLogsProvider';

export const getScriptLogsProvider = (chainId: number): LogsProvider => {
  if (isBackendSupportedChain(chainId)) {
    return new DivideAndConquerLogsProvider(new ScriptLogsProvider(chainId));
  }

  return new DivideAndConquerLogsProvider(new ViemLogsProvider(chainId, getChainLogsRpcUrl(chainId)));
};
