import { ChainId } from '@revoke.cash/chains';
import { CovalentEventGetter } from './logs/CovalentEventGetter';
import { CustomEventGetter } from './logs/CustomEventGetter';
import { EtherscanEventGetter } from './logs/EtherscanEventGetter';
import { NodeEventGetter } from './logs/NodeEventGetter';
import { TeloscanEventGetter } from './logs/TeloscanEventGetter';

// These variables should only get initiated once, which is why they live in their own file
// (would get initiated once per chain ID if in the /logs route file)

export const covalentEventGetter = new CovalentEventGetter(
  process.env.COVALENT_API_KEY,
  process.env.COVALENT_IS_PREMIUM === 'true',
);
export const etherscanEventGetter = new EtherscanEventGetter();
export const nodeEventGetter = new NodeEventGetter(JSON.parse(process.env.NODE_URLS ?? '{}'));

export const customEventGetter = new CustomEventGetter({
  [ChainId.TelosEVMMainnet]: new TeloscanEventGetter(),
});
