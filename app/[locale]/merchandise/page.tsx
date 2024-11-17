import ProseLayout from 'app/layouts/ProseLayout';
import Divider from 'components/common/Divider';
import type { Metadata, NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import Image from 'next/image';

interface Props {
  params: {
    locale: string;
  };
}

export const dynamic = 'error';

export const generateMetadata = async ({ params: { locale } }): Promise<Metadata> => {
  const t = await getTranslations({ locale });

  return {
    title: t('merchandise.meta.title'),
    description: t('merchandise.meta.description'),
  };
};

const MerchandisePage: NextPage<Props> = ({ params }) => {
  unstable_setRequestLocale(params.locale);
  const t = useTranslations();

  return (
    <ProseLayout>
      <h1>{t('merchandise.title')}</h1>
      <Divider className="my-4" />

      <p>{t('merchandise.sections.intro.content')}</p>

      <div className="mx-auto my-2 md:my-4 flex flex-col items-center gap-2 not-prose">
        <Image
          src="/assets/images/merchandise/revoke-shirt.jpg"
          alt="First Edition Revoke T-shirt"
          height="1500"
          width="2000"
          className="rounded-lg border border-black dark:border-white"
          priority
          fetchPriority="high"
        />
        <figcaption className="text-base leading-none text-zinc-600 dark:text-zinc-400">
          {t('merchandise.captions.revoke-shirt')}
        </figcaption>
      </div>

      <p>{t('merchandise.sections.intro.content-2')}</p>

      <h2>{t('merchandise.sections.claiming.title')}</h2>

      <p>{t('merchandise.sections.claiming.content')}</p>

      <p>{t('merchandise.sections.claiming.content-2')}</p>
    </ProseLayout>
  );
};

export default MerchandisePage;
