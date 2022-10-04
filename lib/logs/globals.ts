import rateLimit from 'express-rate-limit';
import { CovalentEventGetter } from './CovalentEventGetter';
import { EtherscanEventGetter } from './EtherscanEventGetter';
import { NodeEventGetter } from './NodeEventGetter';

// These variables should only get initiated once, which is why they live in their own file
// (would get inintiated once per chain ID if in the /logs route file)

export const rateLimiter = rateLimit({
  windowMs: 1 * 1000, // 1s
  max: 10, // 10 requests
});

export const covalentEventGetter = new CovalentEventGetter(JSON.parse(process.env.COVALENT_API_KEYS));
export const etherscanEventGetter = new EtherscanEventGetter(JSON.parse(process.env.ETHERSCAN_API_KEYS));
export const nodeEventGetter = new NodeEventGetter(JSON.parse(process.env.NODE_URLS));
