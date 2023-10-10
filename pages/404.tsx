import { GlobeEuropeAfricaIcon, QuestionMarkCircleIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Href from 'components/common/Href';
import NotFoundLink from 'components/common/NotFoundLink';
import ContentPageLayout from 'layouts/ContentPageLayout';
import { useMounted } from 'lib/hooks/useMounted';
import useTranslation from 'next-translate/useTranslation';
import Error from 'next/error';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';

const ErrorPage404 = () => {
  const { t } = useTranslation();
  const { address: account } = useAccount();
  const isMounted = useMounted();
  const router = useRouter();

  // Make /data 404 errors use up less bandwidth (TODO: Find a way to reduce it even more - still 2.4kb, should be like 0.2kb)
  if (router.asPath.startsWith('/data')) {
    return <Error statusCode={404} />;
  }

  return (
    <ContentPageLayout>
      <div className="flex flex-col gap-8 mx-auto max-w-xl">
        <div className="text-center flex flex-col gap-2">
          <p className="text-zinc-900 font-semibold">404</p>
          <h1>{t('common:errors.404.title')}</h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400">{t('common:errors.404.subtitle')}</p>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-zinc-500 dark:text-zinc-400">
            {t('common:errors.404.suggested_pages.title')}
          </h2>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
            <NotFoundLink
              title={t('common:errors.404.suggested_pages.faq.title')}
              href="/learn/faq"
              description={t('common:errors.404.suggested_pages.faq.description')}
              icon={<QuestionMarkCircleIcon className="h-6 w-6" />}
            />
            <NotFoundLink
              title={t('common:errors.404.suggested_pages.extension.title')}
              href="/extension"
              description={t('common:errors.404.suggested_pages.extension.description')}
              icon={<GlobeEuropeAfricaIcon className="h-6 w-6" />}
            />
            {isMounted && account && (
              <NotFoundLink
                title={t('common:errors.404.suggested_pages.your_allowances.title')}
                href={`/address/${account}`}
                description={t('common:errors.404.suggested_pages.your_allowances.description')}
                icon={<UserCircleIcon className="h-6 w-6" />}
              />
            )}
          </div>
          <p>
            <Href href="/" className="font-medium" underline="none">
              {t('common:errors.404.go_home')} &rarr;
            </Href>
          </p>
        </div>
      </div>
    </ContentPageLayout>
  );
};

export default ErrorPage404;
