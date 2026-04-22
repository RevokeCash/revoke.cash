import { getChainName, ORDERED_CHAINS } from 'lib/utils/chains';

const keywordTemplate = process.argv[2];

ORDERED_CHAINS.forEach((chain) => {
  console.log(keywordTemplate.replace(/{{chain}}/g, getChainName(chain).toLowerCase()));
});
