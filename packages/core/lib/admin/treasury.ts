import { ERC20_ABI } from '@revoke.cash/core/abis';
import {
  createViemPublicClientForChain,
  getChainNativeToken,
  isMainnetChain,
  SUPPORTED_CHAINS,
} from '@revoke.cash/core/chains';
import { FEES_ADDRESS, SUBSCRIPTIONS_ADDRESS } from '@revoke.cash/core/constants';
import {
  getPaymentTokens,
  type PaymentTokenSymbol,
  PREMIUM_PAYMENT_CHAIN_IDS,
  type PremiumPaymentChainId,
} from '@revoke.cash/core/premium/payment-config';
import { getNativeTokenPriceUsd, getTokenPricesUsd } from '@revoke.cash/core/prices';
import type { Address, PublicClient } from 'viem';

// Native token balances are always denominated in wei, matching what eth_getBalance returns
const NATIVE_TOKEN_DECIMALS = 18;

// Bridging a token takes an approval plus a deposit (about 140k gas), and wallets reserve a max fee of up to about 3x the
// current gas price
const TOKEN_MOVE_GAS = 500_000n;

export interface TreasuryNativeBalance {
  chainId: number;
  nativeToken: string;
  decimals: number;
  // Raw balance in the smallest unit as a string, because JSON has no bigint; null when the RPC call failed
  balance: string | null;
  priceUsd: number | null;
  balanceUsd: number | null;
}

export interface TreasuryTokenBalance {
  chainId: PremiumPaymentChainId;
  tokenSymbol: PaymentTokenSymbol;
  tokenAddress: Address;
  decimals: number;
  // Raw balance in the smallest unit as a string, because JSON has no bigint; null when the RPC call failed
  balance: string | null;
  priceUsd: number | null;
  balanceUsd: number | null;
  nativeToken: string;
  // Whether the subscriptions address holds enough of the native token to pay the gas for moving its tokens on this
  // chain; null when the RPC calls failed
  hasEnoughGas: boolean | null;
}

export interface TreasuryBalances {
  nativeBalances: TreasuryNativeBalance[];
  tokenBalances: TreasuryTokenBalance[];
}

export const getTreasuryBalances = async (): Promise<TreasuryBalances> => {
  const [nativeBalances, tokenBalances] = await Promise.all([getFeeNativeBalances(), getSubscriptionTokenBalances()]);

  return { nativeBalances, tokenBalances };
};

// Batch revoke fees are paid in the native token on every chain the app supports, so all of them are
// checked to find the ones that still hold a balance. Testnets are skipped: their native tokens share a
// symbol with the mainnet token they mirror, so pricing them would value worthless balances as real money.
const getFeeNativeBalances = async (): Promise<TreasuryNativeBalance[]> => {
  const mainnetChainIds = SUPPORTED_CHAINS.filter((chainId) => isMainnetChain(chainId));

  return Promise.all(mainnetChainIds.map((chainId) => getFeeNativeBalanceForChain(chainId)));
};

const getFeeNativeBalanceForChain = async (chainId: number): Promise<TreasuryNativeBalance> => {
  const publicClient = createViemPublicClientForChain(chainId);
  const nativeToken = getChainNativeToken(chainId);
  const emptyBalance = { chainId, nativeToken, decimals: NATIVE_TOKEN_DECIMALS };

  const balanceWei = await publicClient.getBalance({ address: FEES_ADDRESS }).catch(() => null);
  if (balanceWei === null) return { ...emptyBalance, balance: null, priceUsd: null, balanceUsd: null };
  if (balanceWei === 0n) return { ...emptyBalance, balance: '0', priceUsd: null, balanceUsd: 0 };

  // Prices are only looked up for chains that hold a balance, which keeps the number of price lookups
  // proportional to the balances that are shown rather than to the number of supported chains
  const priceUsd = await getNativeTokenPriceUsd(chainId).catch(() => null);

  return {
    ...emptyBalance,
    balance: balanceWei.toString(),
    priceUsd,
    balanceUsd: toBalanceUsd(balanceWei, NATIVE_TOKEN_DECIMALS, priceUsd),
  };
};

// Subscription payments are received in USDC and USDT on the premium payment chains
const getSubscriptionTokenBalances = async (): Promise<TreasuryTokenBalance[]> => {
  const balancesByChain = await Promise.all(
    PREMIUM_PAYMENT_CHAIN_IDS.map((chainId) => getSubscriptionTokenBalancesForChain(chainId)),
  );

  return balancesByChain.flat();
};

const getSubscriptionTokenBalancesForChain = async (
  chainId: PremiumPaymentChainId,
): Promise<TreasuryTokenBalance[]> => {
  const publicClient = createViemPublicClientForChain(chainId);
  const nativeToken = getChainNativeToken(chainId);

  const [balances, hasEnoughGas] = await Promise.all([
    // The public client batches the token reads for a single chain into one multicall
    Promise.all(
      getPaymentTokens(chainId).map(async (paymentToken) => ({
        paymentToken,
        balanceUnits: await publicClient
          .readContract({
            address: paymentToken.address,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [SUBSCRIPTIONS_ADDRESS],
          })
          .catch(() => null),
      })),
    ),
    hasGasToMoveTokens(publicClient),
  ]);

  const addressesWithBalance = balances
    .filter((entry) => entry.balanceUnits)
    .map((entry) => entry.paymentToken.address);

  const pricesByAddress: Record<Address, number | null> =
    addressesWithBalance.length > 0 ? await getTokenPricesUsd(chainId, addressesWithBalance).catch(() => ({})) : {};

  return balances.map(({ paymentToken, balanceUnits }) => {
    const priceUsd = pricesByAddress[paymentToken.address] ?? null;

    return {
      chainId,
      tokenSymbol: paymentToken.symbol,
      tokenAddress: paymentToken.address,
      decimals: paymentToken.decimals,
      balance: balanceUnits?.toString() ?? null,
      priceUsd,
      balanceUsd: balanceUnits === null ? null : toBalanceUsd(balanceUnits, paymentToken.decimals, priceUsd),
      nativeToken,
      hasEnoughGas,
    };
  });
};

const hasGasToMoveTokens = async (publicClient: PublicClient): Promise<boolean | null> => {
  try {
    const [nativeBalanceWei, gasPrice] = await Promise.all([
      publicClient.getBalance({ address: SUBSCRIPTIONS_ADDRESS }),
      publicClient.getGasPrice(),
    ]);

    return nativeBalanceWei >= gasPrice * TOKEN_MOVE_GAS;
  } catch {
    return null;
  }
};

// A zero balance is worth nothing whether or not a price could be found for the token
const toBalanceUsd = (balanceUnits: bigint, decimals: number, priceUsd: number | null): number | null => {
  if (balanceUnits === 0n) return 0;
  if (priceUsd === null) return null;
  return (Number(balanceUnits) / 10 ** decimals) * priceUsd;
};
