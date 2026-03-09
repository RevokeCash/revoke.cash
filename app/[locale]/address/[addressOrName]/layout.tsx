import SharedLayout from 'app/layouts/SharedLayout';
import AddressHeader from 'components/address/AddressHeader';
import AddressNavigation from 'components/address/navigation/AddressNavigation';
import { AddressPageContextProvider } from 'lib/hooks/page-context/AddressPageContext';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import { redirect } from 'lib/i18n/navigation';
import { hasActivePremiumEntitlement } from 'lib/premium/entitlements';
import { getAddressAndDomainName } from 'lib/utils/whois';
import { headers } from 'next/headers';
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
  if (isPremium) {
    const path = (await headers()).get('x-url-path');
    if (!path) notFound();
    const href = `/premium${path}`;
    redirect({ href, locale });
  }

  return (
    <SharedLayout>
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
        <AddressPageContextProvider address={address} domainName={domainName}>
          <NextIntlClientProvider messages={{ common: messages.common, address: messages.address }}>
            <AddressHeader />
            <AddressNavigation />
            {children}
          </NextIntlClientProvider>
        </AddressPageContextProvider>
      </div>
    </SharedLayout>
  );
};

export default AddressPageLayout;
