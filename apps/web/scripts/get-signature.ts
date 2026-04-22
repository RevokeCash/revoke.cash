import { getFunctionSelector } from 'viem';

const fragment = process.argv[2];
console.log(getFunctionSelector(fragment));
