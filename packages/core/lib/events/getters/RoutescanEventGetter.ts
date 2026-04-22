import { getChainApiIdentifer, getChainApiRateLimit, ROUTESCAN_SUPPORTED_CHAINS } from '@revoke.cash/core/chains';
import { RequestQueue } from '@revoke.cash/core/request-queue';
import { EtherscanEventGetter } from './EtherscanEventGetter';
import type { EventGetter } from './EventGetter';

export class RoutescanEventGetter extends EtherscanEventGetter implements EventGetter {
  constructor() {
    super();

    const queueEntries = ROUTESCAN_SUPPORTED_CHAINS.map((chainId) => [
      chainId,
      new RequestQueue(getChainApiIdentifer(chainId), getChainApiRateLimit(chainId)),
    ]);

    this.queues = Object.fromEntries(queueEntries);
  }
}
