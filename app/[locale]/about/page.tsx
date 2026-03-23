import ContentPageLayout from 'app/layouts/ContentPageLayout';
import ContentPageHero from 'components/common/ContentPageHero';
import Href from 'components/common/Href';
import Prose from 'components/common/Prose';
import RichText from 'components/common/RichText';
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
    title: t('about.meta.title'),
    description: t('about.meta.description'),
  };
};

const AboutPage: NextPage<Props> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale });

  return (
    <ContentPageLayout hero={<ContentPageHero title={t('about.title')} />}>
      <Prose>
        <p>
          <RichText>{(tags) => t.rich('about.body.intro', tags)}</RichText>
        </p>
      </Prose>

      <div className="mx-auto my-6 flex flex-col items-center gap-2">
        <Href href="https://twitter.com/RoscoKalis/status/1183412994375503872" underline="none" external>
          <Image
            src="/assets/images/about/revoke-tweet.png"
            alt="Initial Revoke.cash Tweet"
            height="1000"
            width="1500"
            className="rounded-xl border border-zinc-200 dark:border-zinc-800"
            priority
            fetchPriority="high"
          />
        </Href>
        <figcaption className="text-sm text-zinc-500 dark:text-zinc-400">{t('about.captions.first_tweet')}</figcaption>
      </div>

      <Prose>
        <p>
          <RichText>{(tags) => t.rich('about.body.growth', tags)}</RichText>
        </p>
      </Prose>

      <div className="mx-auto my-6 flex flex-col items-center gap-2">
        <Image
          src="/assets/images/about/revoke-team.png"
          alt="Revoke.cash Team"
          height="720"
          width="1280"
          className="rounded-xl border border-zinc-200 dark:border-zinc-800"
        />
        <figcaption className="text-sm text-zinc-500 dark:text-zinc-400">{t('about.captions.team')}</figcaption>
      </div>

      <Prose>
        <p>{t('about.body.team')}</p>
        <p>
          <RichText>{(tags) => t.rich('about.body.learn_more', tags)}</RichText>
        </p>
      </Prose>
    </ContentPageLayout>
  );
};

export default AboutPage;
