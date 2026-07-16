import { toFunctionSelector } from 'viem';

const fragment = process.argv[2];
console.log(toFunctionSelector(fragment));
