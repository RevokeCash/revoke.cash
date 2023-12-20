export interface NFTSalesGetter {
  getNFTSales: (chainId: number, contractAddress: string, order: 'asc' | 'desc', limit: number) => Promise<NFTSale[]>;
  getNFTFloorPrice: (chainId: number, contractAddress: string) => Promise<bigint>;
}

export type NFTSale = {
  marketplace: string;
  marketplaceAddress: string;
  contractAddress: string;
  tokenId: string;
  quantity: string;
  buyerAddress: string;
  sellerAddress: string;
  taker: string;
  sellerFee: {
    amount: string;
    tokenAddress: string;
    symbol: string;
    decimals: number;
  };
  protocolFee: {
    amount: string;
    tokenAddress: string;
    symbol: string;
    decimals: number;
  };
  royaltyFee: {
    amount: string;
    tokenAddress: string;
    symbol: string;
    decimals: number;
  };
  blockNumber: number;
  logIndex: number;
  bundleIndex: number;
  transactionHash: string;
  price: bigint;
};
