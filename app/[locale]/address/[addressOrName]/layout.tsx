import SharedLayout from 'app/layouts/SharedLayout';
import AddressHeader from 'components/address/AddressHeader';
import AddressNavigation from 'components/address/navigation/AddressNavigation';
import PremiumAddressHeader from 'components/address/PremiumAddressHeader';
import PremiumAllowancePageProvider from 'components/address/PremiumAllowancePageProvider';
import { AddressIdentityContextProvider } from 'lib/hooks/page-context/AddressIdentityContext';
import { AddressPageContextProvider } from 'lib/hooks/page-context/AddressPageContext';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import { hasActivePremiumEntitlement } from 'lib/premium/entitlements';
import { getAddressAndDomainName } from 'lib/utils/whois';
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

  const isPremium = await hasActivePremiumEntitlement(address);

  return (
    <SharedLayout>
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
        <AddressIdentityContextProvider address={address} domainName={domainName} isPremium={isPremium}>
          <NextIntlClientProvider
            messages={{ common: messages.common, address: messages.address, exploits: messages.exploits }}
          >
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
