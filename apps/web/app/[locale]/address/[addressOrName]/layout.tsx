import {
  getActivePremiumEntitlementsWithSingleRetry,
  summarizeEntitlements,
} from '@revoke.cash/core/premium/entitlements';
import { getAddressAndDomainName } from '@revoke.cash/core/whois';
import CrispViewedAddress from 'app/CrispViewedAddress';
import SharedLayout from 'app/layouts/SharedLayout';
import AddressPageExperience from 'components/address/AddressPageExperience';
import { AddressIdentityContextProvider } from 'lib/hooks/page-context/AddressIdentityContext';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import { notFound } from 'next/navigation';
import { getMessages, setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  params: Promise<Params>;
}

interface Params {
  locale: string;
  addressOrName: string;
}

const AddressPageLayout = async ({ params, children }: Props) => {
  const { locale, addressOrName } = await params;
  setRequestLocale(locale);

  const messages = await getMessages({ locale });

  const { address, domainName } = await getAddressAndDomainName(addressOrName);
  if (!address) notFound();

  // The address page falls back to the free experience when the entitlement lookup fails
  const entitlements = await getActivePremiumEntitlementsWithSingleRetry(address).catch(() => []);
  const { isPremium, isUltimate, ownEndsAt } = summarizeEntitlements(address, entitlements);

  return (
    <SharedLayout searchBar>
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
        <AddressIdentityContextProvider
          address={address}
          domainName={domainName}
          isPremium={isPremium}
          isUltimate={isUltimate}
          premiumEndsAt={ownEndsAt ?? undefined}
        >
          <NextIntlClientProvider
            messages={{ common: messages.common, address: messages.address, exploits: messages.exploits }}
          >
            <CrispViewedAddress />
            <AddressPageExperience>{children}</AddressPageExperience>
          </NextIntlClientProvider>
        </AddressIdentityContextProvider>
      </div>
    </SharedLayout>
  );
};

export default AddressPageLayout;
