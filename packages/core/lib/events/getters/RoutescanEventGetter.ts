import { ROUTESCAN_SUPPORTED_CHAINS } from '@revoke.cash/core/chains';
import { createExplorerClients, EtherscanEventGetter } from './EtherscanEventGetter';
import type { EventGetter } from './EventGetter';

export class RoutescanEventGetter extends EtherscanEventGetter implements EventGetter {
  constructor() {
    super();

    this.clients = createExplorerClients(ROUTESCAN_SUPPORTED_CHAINS);
  }
}
