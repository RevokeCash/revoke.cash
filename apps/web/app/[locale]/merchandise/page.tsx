import ContentPageLayout from 'app/layouts/ContentPageLayout';
import ContentPageHero from 'components/common/ContentPageHero';
import Prose from 'components/common/Prose';
import type { Metadata, NextPage } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';

interface Props {
  params: Promise<Params>;
}

interface Params {
  locale: string;
}

export const dynamic = 'error';

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { locale } = await params;

  const t = await getTranslations({ locale });

  return {
    title: t('merchandise.meta.title'),
    description: t('merchandise.meta.description'),
  };
};

const MerchandisePage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });

  return (
    <ContentPageLayout hero={<ContentPageHero title={t('merchandise.title')} />}>
      <Prose>
        <p>{t('merchandise.sections.intro.content')}</p>
      </Prose>

      <div className="mx-auto my-6 flex flex-col items-center gap-2">
        <Image
          src="/assets/images/merchandise/revoke-shirt.jpg"
          alt="First Edition Revoke T-shirt"
          height="1500"
          width="2000"
          className="rounded-xl border border-zinc-200 dark:border-zinc-800"
          priority
          fetchPriority="high"
        />
        <figcaption className="text-sm text-zinc-500 dark:text-zinc-400">
          {t('merchandise.captions.revoke-shirt')}
        </figcaption>
      </div>

      <Prose>
        <p>{t('merchandise.sections.intro.content-2')}</p>
        <h2>{t('merchandise.sections.claiming.title')}</h2>
        <p>{t('merchandise.sections.claiming.content')}</p>
        <p>{t('merchandise.sections.claiming.content-2')}</p>
      </Prose>
    </ContentPageLayout>
  );
};

export default MerchandisePage;
