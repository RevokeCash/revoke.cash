'use client';

import { CRISP_WEBSITE_ID, DISCORD_URL } from '@revoke.cash/core/constants';
import { isNullish } from '@revoke.cash/core/utils';
import Href from 'components/common/Href';
import { Crisp } from 'crisp-sdk-web';
import { useTranslations } from 'next-intl';

// Shown after a failed or unconfirmed payment; points to live chat when Crisp is configured, Discord otherwise
const PaymentHelpNote = () => {
  const t = useTranslations();

  return (
    <p className="text-sm text-zinc-600 dark:text-zinc-400">
      {t.rich('premium.checkout.payment_help', {
        'support-link': (children) =>
          isNullish(CRISP_WEBSITE_ID) ? (
            <Href href={DISCORD_URL} external underline="always">
              {children}
            </Href>
          ) : (
            <button
              type="button"
              onClick={() => Crisp.chat.open()}
              className="cursor-pointer underline hover:underline decoration-brand"
            >
              {children}
            </button>
          ),
      })}
    </p>
  );
};

export default PaymentHelpNote;
