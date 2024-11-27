import SharedLayout from 'app/layouts/SharedLayout';
import AddressHeader from 'components/address/AddressHeader';
import { AddressPageContextProvider } from 'lib/hooks/page-context/AddressPageContext';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import { getAddressAndDomainName } from 'lib/utils/whois';
import { getMessages, unstable_setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  params: {
    locale: string;
    addressOrName: string;
  };
}

const AddressPageLayout = async ({ params, children }: Props) => {
  unstable_setRequestLocale(params.locale);

  const messages = await getMessages({ locale: params.locale });

  const { address, domainName } = await getAddressAndDomainName(params.addressOrName);
  if (!address) notFound();

  return (
    <SharedLayout>
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8">
        <AddressPageContextProvider address={address} domainName={domainName}>
          <NextIntlClientProvider messages={{ common: messages.common, address: messages.address }}>
            <AddressHeader />
            {children}
          </NextIntlClientProvider>
        </AddressPageContextProvider>
      </div>
    </SharedLayout>
  );
};

export default AddressPageLayout;
