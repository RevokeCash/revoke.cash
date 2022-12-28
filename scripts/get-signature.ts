import { Interface } from 'ethers/lib/utils';

const fragment = process.argv[2];

const signature = new Interface([`function ${fragment}`]).getSighash(fragment);
console.log(signature);
