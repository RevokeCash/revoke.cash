import { GlobeEuropeAfricaIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import ContentPageLayout from 'app/layouts/ContentPageLayout';
import Href from 'components/common/Href';
import NotFoundLink from 'components/common/NotFoundLink';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import { NextPage } from 'next';
import { useMessages, useTranslations } from 'next-intl';
import NotFoundLinkMyApprovals from './NotFoundLinkMyApprovals';

interface Props {
  params: {
    locale: string;
  };
}

const NotFoundPage: NextPage<Props> = ({ params }) => {
  // Somehow this does not work for the not-found page. This is alright though.
  // unstable_setRequestLocale(params.locale);

  const t = useTranslations();
  const messages = useMessages();

  return (
    <ContentPageLayout>
      <div className="flex flex-col gap-8 mx-auto max-w-xl">
        <div className="text-center flex flex-col gap-2">
          <p className="text-zinc-900 font-semibold">404</p>
          <h1>{t('common.errors.404.title')}</h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">{t('common.errors.404.subtitle')}</p>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-zinc-500 dark:text-zinc-400">
            {t('common.errors.404.suggested_pages.title')}
          </h2>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
            <NotFoundLink
              title={t('common.errors.404.suggested_pages.faq.title')}
              href="/learn/faq"
              description={t('common.errors.404.suggested_pages.faq.description')}
              icon={<QuestionMarkCircleIcon className="h-6 w-6" />}
            />
            <NotFoundLink
              title={t('common.errors.404.suggested_pages.extension.title')}
              href="/extension"
              description={t('common.errors.404.suggested_pages.extension.description')}
              icon={<GlobeEuropeAfricaIcon className="h-6 w-6" />}
            />
            <NextIntlClientProvider messages={{ common: messages.common }}>
              <NotFoundLinkMyApprovals />
            </NextIntlClientProvider>
          </div>
          <p>
            <Href href="/" className="font-medium" underline="none">
              {t('common.errors.404.go_home')} &rarr;
            </Href>
          </p>
        </div>
      </div>
    </ContentPageLayout>
  );
};

export default NotFoundPage;
