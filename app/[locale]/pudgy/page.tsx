import ProseLayout from 'app/layouts/ProseLayout';
import Divider from 'components/common/Divider';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import type { Metadata, NextPage } from 'next';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import PudgyCheckerWrapper from './PudgyCheckerWrapper';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

export const dynamic = 'error';

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  return {
    title: 'Revoke.cash x Pudgy Penguins',
    description: 'Revoke.cash x Pudgy Penguins',
  };
};

const PudgyPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });
  const messages = await getMessages({ locale });

  return (
    <ProseLayout>
      <h1>Revoke.cash x Pudgy Penguins</h1>
      <Divider className="my-4" />

      <p>We've teamed up with Pudgy Penguins to educate users about the benefits of hardware wallets.</p>

      <p>Yada yada yada</p>

      <p>Check eligibility here:</p>

      <div className="not-prose">
        <NextIntlClientProvider messages={{ common: messages.common, pudgy: messages.pudgy }}>
          <PudgyCheckerWrapper />
        </NextIntlClientProvider>
      </div>
    </ProseLayout>
  );
};

export default PudgyPage;
