import { CovalentEventGetter } from './logs/CovalentEventGetter';
import { EtherscanEventGetter } from './logs/EtherscanEventGetter';
import { NodeEventGetter } from './logs/NodeEventGetter';

// These variables should only get initiated once, which is why they live in their own file
// (would get initiated once per chain ID if in the /logs route file)

export const covalentEventGetter = new CovalentEventGetter(
  process.env.COVALENT_API_KEY,
  process.env.COVALENT_IS_PREMIUM === 'true',
);
export const etherscanEventGetter = new EtherscanEventGetter();
export const nodeEventGetter = new NodeEventGetter(JSON.parse(process.env.NODE_URLS));
