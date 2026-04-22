import ky from 'lib/ky';
import { type Address, getAddress } from 'viem';

export const getNativeTokenPrice = async (chainId: number): Promise<number | null> => {
  const response = await ky.get(`/api/${chainId}/native-price`).json<{ price: number | null }>();
  return response.price;
};

export const getTokenPrices = async (
  chainId: number,
  addresses: Address[],
): Promise<Record<Address, number | null>> => {
  if (addresses.length === 0) return {} as Record<Address, number | null>;

  const normalizedAddresses = addresses.map((address) => getAddress(address));

  const response = await ky
    .post(`/api/${chainId}/token-prices`, { json: { addresses: normalizedAddresses } })
    .json<{ prices: Record<string, number | null> }>();

  return response.prices as Record<Address, number | null>;
};
