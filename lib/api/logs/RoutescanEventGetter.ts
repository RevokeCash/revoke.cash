import { getChainApiIdentifer, getChainApiRateLimit, ROUTESCAN_SUPPORTED_CHAINS } from 'lib/utils/chains';
import { EtherscanEventGetter } from './EtherscanEventGetter';
import type { EventGetter } from './EventGetter';
import { RequestQueue } from './RequestQueue';

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
