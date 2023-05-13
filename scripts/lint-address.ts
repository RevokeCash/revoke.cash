import { utils } from 'ethers';

const address = process.argv[2];
console.log(utils.getAddress(address));
