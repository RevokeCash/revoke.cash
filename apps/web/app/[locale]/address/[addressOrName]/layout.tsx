import { hasActivePremiumEntitlement, hasActiveUltimateEntitlement } from '@revoke.cash/core/premium/entitlements';
import { getAddressAndDomainName } from '@revoke.cash/core/whois';
import CrispPremiumPageSync from 'app/CrispPremiumPageSync';
import SharedLayout from 'app/layouts/SharedLayout';
import AddressHeader from 'components/address/AddressHeader';
import AddressNavigation from 'components/address/navigation/AddressNavigation';
import PremiumAddressHeader from 'components/address/PremiumAddressHeader';
import PremiumAllowancePageProvider from 'components/address/PremiumAllowancePageProvider';
import { AddressIdentityContextProvider } from 'lib/hooks/page-context/AddressIdentityContext';
import { AddressPageContextProvider } from 'lib/hooks/page-context/AddressPageContext';
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
  const [isPremium, isUltimate] = await Promise.all([
    hasActivePremiumEntitlement(address).catch(() => false),
    hasActiveUltimateEntitlement(address).catch(() => false),
  ]);

  return (
    <SharedLayout searchBar>
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
        <AddressIdentityContextProvider
          address={address}
          domainName={domainName}
          isPremium={isPremium}
          isUltimate={isUltimate}
        >
          <NextIntlClientProvider
            messages={{ common: messages.common, address: messages.address, exploits: messages.exploits }}
          >
            <CrispPremiumPageSync />
            {isPremium ? (
              <PremiumAllowancePageProvider>
                <PremiumAddressHeader />
                <AddressNavigation />
                {children}
              </PremiumAllowancePageProvider>
            ) : (
              <AddressPageContextProvider address={address}>
                <AddressHeader />
                <AddressNavigation />
                {children}
              </AddressPageContextProvider>
            )}
          </NextIntlClientProvider>
        </AddressIdentityContextProvider>
      </div>
    </SharedLayout>
  );
};

export default AddressPageLayout;
