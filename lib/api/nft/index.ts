import { ResevoirNFT } from './Resevoir';

export interface NFTGetter {
  getFloorPriceUSD: (contractAddress: string) => Promise<number>;
}

export { ResevoirNFT };
