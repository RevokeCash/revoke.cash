'use client';

import { DialogTitle } from '@headlessui/react';
import type { PremiumPlanTier } from '@revoke.cash/core/premium/plans';
import { isUserRejectionError, parseErrorMessage } from '@revoke.cash/core/utils/errors';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import NoticeBanner from 'components/common/NoticeBanner';
import Spinner from 'components/common/Spinner';
import CheckoutForm from 'components/premium/checkout/CheckoutForm';
import CheckoutSuccess from 'components/premium/checkout/CheckoutSuccess';
import { useSiweSignIn } from 'lib/hooks/ethereum/siwe/useSiweSignIn';
import { useCheckoutPlan } from 'lib/hooks/premium/useCheckoutPlan';
import { usePaymentOptionSelection } from 'lib/hooks/premium/usePaymentOptionSelection';
import { useSubscribe } from 'lib/hooks/premium/useSubscribe';
import analytics from 'lib/utils/analytics';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

export type CheckoutSource = 'pricing_page' | 'account_page' | 'auto_revoke_upsell';

interface Props {
  tier: PremiumPlanTier;
  open: boolean;
  setOpen: (open: boolean) => void;
  onTierChange: (tier: PremiumPlanTier) => void;
  source: CheckoutSource;
}

const CheckoutModal = ({ tier, open, setOpen, onTierChange, source }: Props) => {
  const t = useTranslations();

  const {
    account,
    isAuthenticated,
    selectedPlan,
    ownActivePlan,
    action,
    isDowngradeOfActivePlan,
    hasCoveringGrantedEntitlement,
    isLoading,
    isPlansError,
  } = useCheckoutPlan(tier, open);

  const paymentOptions = usePaymentOptionSelection(open, selectedPlan, account);
  const { signIn, isLoading: isSigningIn, error: signInError } = useSiweSignIn();

  const { subscribe, isSubscribing, status, error, notice, reset } = useSubscribe({
    ownerAddress: account!,
    selectedPlan,
    selectedPaymentChainId: paymentOptions.selectedPaymentChainId,
    selectedPaymentToken: paymentOptions.selectedPaymentToken,
    isAuthenticated,
  });

  // Reopening the modal after a completed or failed attempt starts a fresh checkout. An unconfirmed attempt keeps its
  // notice, because that notice tells the user not to pay a second time.
  const wasOpen = useRef(open);
  useEffect(() => {
    const justOpened = open && !wasOpen.current;
    wasOpen.current = open;
    if (justOpened && (status === 'confirmed' || status === 'failed')) reset();
  }, [open, status, reset]);

  const handlePay = async () => {
    if (!selectedPlan || !paymentOptions.selectedPaymentToken) return;

    analytics.track('Subscribe Clicked', {
      planId: selectedPlan.id,
      chainId: paymentOptions.selectedPaymentChainId,
      tokenSymbol: paymentOptions.selectedPaymentToken.symbol,
      action,
      source,
      isAuthenticated,
      // Omitted while the balance is unknown, so false always means a known-unpayable attempt
      hasSufficientBalance: paymentOptions.selectedBalance === null ? undefined : paymentOptions.hasSufficientBalance,
    });

    if (status === 'failed' || status === 'unconfirmed') reset();

    if (!isAuthenticated) {
      const signedInAddress = await signIn().catch(() => null);
      if (!signedInAddress) {
        analytics.track(
          'Subscription Sign In Failed',
          { planId: selectedPlan.id, source },
          { crisp: true, crispColor: 'orange' },
        );
        return;
      }
    }

    subscribe();
  };

  const getPayButtonLabel = (): string => {
    if (status === 'failed') return t('premium.checkout.buttons.try_again');
    if (isSigningIn) return t('premium.checkout.verify_button');
    if (isSubscribing) return t(`premium.checkout.buttons.${status}`);
    return t('premium.checkout.pay_button', {
      amount: (selectedPlan?.priceUsdCents ?? 0) / 100,
      token: paymentOptions.selectedPaymentToken?.symbol ?? 'USDC',
    });
  };

  const errorMessage =
    error ?? (signInError && !isUserRejectionError(signInError) ? parseErrorMessage(signInError) : null);

  return (
    <Modal
      open={open}
      setOpen={setOpen}
      onlyExplicitClose={isSigningIn || isSubscribing}
      className="sm:max-w-lg overflow-visible"
    >
      <div className="flex flex-col gap-4">
        {isPlansError && <NoticeBanner style="warning">{t('premium.checkout.plans_unavailable')}</NoticeBanner>}

        {!isPlansError && (isLoading || !selectedPlan) && (
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        )}

        {selectedPlan && !isLoading && status === 'confirmed' && <CheckoutSuccess plan={selectedPlan} />}

        {selectedPlan && !isLoading && status !== 'confirmed' && (
          <>
            <DialogTitle as="h2" className="text-2xl font-semibold pr-8">
              {t(`premium.checkout.titles.${action}`, { planName: selectedPlan.name })}
            </DialogTitle>

            {isDowngradeOfActivePlan && ownActivePlan ? (
              <>
                <NoticeBanner style="info">
                  {t('premium.checkout.downgrade_notice', { planName: ownActivePlan.name })}
                </NoticeBanner>
                <Button
                  style="primary"
                  size="md"
                  className="w-full justify-center"
                  onClick={() => onTierChange(ownActivePlan.tier)}
                >
                  {t('premium.checkout.titles.extend', { planName: ownActivePlan.name })}
                </Button>
              </>
            ) : (
              <CheckoutForm
                plan={selectedPlan}
                account={account}
                isAuthenticated={isAuthenticated}
                showGrantedAccessNote={hasCoveringGrantedEntitlement}
                paymentOptions={paymentOptions}
                payButtonLabel={getPayButtonLabel()}
                onPay={handlePay}
                isPaying={isSigningIn || isSubscribing}
                errorMessage={errorMessage}
                noticeMessage={notice}
                showPaymentHelp={status === 'failed' || status === 'unconfirmed'}
              />
            )}
          </>
        )}
      </div>
    </Modal>
  );
};

export default CheckoutModal;
