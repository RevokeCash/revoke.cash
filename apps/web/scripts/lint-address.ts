import { getAddress } from 'viem';

const address = process.argv[2];
console.log(getAddress(address));
