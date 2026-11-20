'use client';

import { getChainName } from '@revoke.cash/core/chains';
import { PREMIUM_PAYMENT_CHAIN_IDS } from '@revoke.cash/core/premium/payment-config';
import { isUltimatePlan } from '@revoke.cash/core/premium/plans';
import type { PremiumPlan } from '@revoke.cash/core/premium/types';
import { formatFixedPointBigInt, shortenAddress } from '@revoke.cash/core/utils/formatting';
import Button from 'components/common/Button';
import Href from 'components/common/Href';
import NoticeBanner from 'components/common/NoticeBanner';
import ChainSelect from 'components/common/select/ChainSelect';
import ConnectButton from 'components/header/ConnectButton';
import PaymentHelpNote from 'components/premium/checkout/PaymentHelpNote';
import PaymentTokenSelect from 'components/premium/checkout/PaymentTokenSelect';
import UltimateWalletNotice from 'components/premium/checkout/UltimateWalletNotice';
import type { PaymentOptionSelection } from 'lib/hooks/premium/usePaymentOptionSelection';
import { useTranslations } from 'next-intl';
import type { Address } from 'viem';

interface Props {
  plan: PremiumPlan;
  account: Address | undefined;
  isAuthenticated: boolean;
  showGrantedAccessNote: boolean;
  paymentOptions: PaymentOptionSelection;
  payButtonLabel: string;
  onPay: () => void;
  isPaying: boolean;
  errorMessage: string | null;
  noticeMessage: string | null;
  showPaymentHelp: boolean;
}

const CheckoutForm = ({
  plan,
  account,
  isAuthenticated,
  showGrantedAccessNote,
  paymentOptions,
  payButtonLabel,
  onPay,
  isPaying,
  errorMessage,
  noticeMessage,
  showPaymentHelp,
}: Props) => {
  const t = useTranslations();

  const {
    selectedPaymentChainId,
    selectedPaymentTokenSymbol,
    selectedPaymentToken,
    paymentTokens,
    selectedBalance,
    hasSufficientBalance,
    choosePaymentChainId,
    choosePaymentTokenSymbol,
  } = paymentOptions;

  return (
    <>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t('premium.checkout.payment_summary', {
          amount: plan.priceUsdCents / 100,
          token: selectedPaymentToken?.symbol ?? 'USDC',
          days: plan.durationDays,
          maxAddresses: plan.maxAddresses,
        })}
      </p>

      {account ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 p-3">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{t('premium.checkout.wallet')}</span>
            <span className="text-sm font-medium">{shortenAddress(account, 4)}</span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t('premium.checkout.connected_wallet_note')}
            {showGrantedAccessNote && <> {t('premium.checkout.granted_access_note')}</>}
          </p>
        </div>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t('premium.checkout.connect_prompt')}</p>
      )}

      <div className="flex flex-wrap items-start gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">{t('premium.checkout.payment_network')}</span>
          <div className={isPaying ? 'pointer-events-none opacity-60' : undefined}>
            <ChainSelect
              instanceId="checkout-payment-chain-select"
              chainIds={[...PREMIUM_PAYMENT_CHAIN_IDS]}
              selected={selectedPaymentChainId}
              onSelect={choosePaymentChainId}
              showNames
            />
          </div>
        </div>

        {paymentTokens.length > 1 && selectedPaymentToken && (
          <div className="flex flex-col gap-2 w-32">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">{t('premium.checkout.payment_token')}</span>
            <div className={isPaying ? 'opacity-60' : undefined}>
              <PaymentTokenSelect
                instanceId="checkout-payment-token-select"
                tokens={paymentTokens}
                selected={selectedPaymentTokenSymbol}
                onSelect={choosePaymentTokenSymbol}
                isDisabled={isPaying}
              />
            </div>
          </div>
        )}
      </div>

      {selectedBalance !== null && selectedPaymentToken && hasSufficientBalance && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {t('premium.checkout.balance', {
            amount: formatFixedPointBigInt(selectedBalance, selectedPaymentToken.decimals, 0, 2),
            token: selectedPaymentToken.symbol,
          })}
        </p>
      )}

      {!hasSufficientBalance && selectedPaymentToken && (
        <NoticeBanner style="warning">
          {t('premium.checkout.insufficient_balance', {
            amount: plan.priceUsdCents / 100,
            token: selectedPaymentToken.symbol,
            chainName: getChainName(selectedPaymentChainId),
          })}
        </NoticeBanner>
      )}

      {isUltimatePlan(plan) && account && <UltimateWalletNotice />}

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {t.rich('premium.checkout.legal_notice', {
          'terms-link': (children) => (
            <Href href="/terms" router underline="always">
              {children}
            </Href>
          ),
        })}
      </p>

      {account ? (
        <Button style="primary" size="md" className="w-full justify-center" onClick={onPay} loading={isPaying}>
          {payButtonLabel}
        </Button>
      ) : (
        <ConnectButton style="primary" size="md" className="w-full justify-center" />
      )}

      {account && !isAuthenticated && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('premium.checkout.siwe_note')}</p>
      )}

      {errorMessage && <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>}

      {noticeMessage && <p className="text-sm text-zinc-600 dark:text-zinc-400">{noticeMessage}</p>}

      {showPaymentHelp && <PaymentHelpNote />}
    </>
  );
};

export default CheckoutForm;
