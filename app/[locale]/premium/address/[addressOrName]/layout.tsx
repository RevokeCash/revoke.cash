import SharedLayout from 'app/layouts/SharedLayout';
import AddressNavigation from 'components/address/navigation/AddressNavigation';
import PremiumAddressHeader from 'components/address/PremiumAddressHeader';
import PremiumAllowancePageProvider from 'components/address/PremiumAllowancePageProvider';
import { AddressIdentityContextProvider } from 'lib/hooks/page-context/AddressIdentityContext';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
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

const PremiumAddressPageLayout = async ({ params, children }: Props) => {
  const { locale, addressOrName } = await params;
  setRequestLocale(locale);

  const messages = await getMessages({ locale });

  const { address, domainName } = await getAddressAndDomainName(addressOrName);
  if (!address) notFound();

  // TODO: Add check if address is premium, if not redirect to non-premium address page

  return (
    <SharedLayout>
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
        <AddressIdentityContextProvider address={address} domainName={domainName}>
          <NextIntlClientProvider messages={{ common: messages.common, address: messages.address }}>
            <PremiumAllowancePageProvider>
              <PremiumAddressHeader />
              <AddressNavigation isPremium />
              {children}
            </PremiumAllowancePageProvider>
          </NextIntlClientProvider>
        </AddressIdentityContextProvider>
      </div>
    </SharedLayout>
  );
};

export default PremiumAddressPageLayout;
