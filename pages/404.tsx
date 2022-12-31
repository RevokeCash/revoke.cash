import { GlobeEuropeAfricaIcon, QuestionMarkCircleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Href from 'components/common/Href';
import NotFoundLink from 'components/common/NotFoundLink';
import ContentPageLayout from 'layouts/ContentPageLayout';
import { useEthereum } from 'lib/hooks/useEthereum';
import useTranslation from 'next-translate/useTranslation';

const Error404 = () => {
  const { t } = useTranslation();
  const { account } = useEthereum();

  return (
    <ContentPageLayout>
      <div className="flex flex-col gap-8 mx-auto max-w-xl">
        <div className="text-center flex flex-col gap-2">
          <p className="text-base font-semibold">404</p>
          <h1 className="text-4xl sm:text-5xl">{t('common:errors.404.title')}</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">{t('common:errors.404.subtitle')}</p>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-semibold text-gray-500 dark:text-gray-400">
            {t('common:errors.404.suggested_pages.title')}
          </h3>
          <div className="divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800">
            <NotFoundLink
              title={t('common:errors.404.suggested_pages.faq.title')}
              href="/faq"
              description={t('common:errors.404.suggested_pages.faq.description')}
              icon={<QuestionMarkCircleIcon className="h-6 w-6" />}
            />
            <NotFoundLink
              title={t('common:errors.404.suggested_pages.extension.title')}
              href="/extension"
              description={t('common:errors.404.suggested_pages.extension.description')}
              icon={<GlobeEuropeAfricaIcon className="h-6 w-6" />}
            />
            {account && (
              <NotFoundLink
                title={t('common:errors.404.suggested_pages.your_allowances.title')}
                href={`/address/${account}`}
                description={t('common:errors.404.suggested_pages.your_allowances.description')}
                icon={<UserCircleIcon className="h-6 w-6" />}
              />
            )}
          </div>
          <div className="text-gray-700 dark:text-gray-300">
            <Href href="/" className="text-base font-medium" underline="none">
              {t('common:errors.404.go_home')} &rarr;
            </Href>
          </div>
        </div>
      </div>
    </ContentPageLayout>
  );
};

export default Error404;
