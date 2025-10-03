import ProseLayout from 'app/layouts/ProseLayout';
import Divider from 'components/common/Divider';
import Href from 'components/common/Href';
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
    <ProseLayout>
      <h1>{t('about.title')}</h1>
      <Divider className="my-4" />

      <p>
        <RichText>{(tags) => t.rich('about.body.intro', tags)}</RichText>
      </p>

      <div className="mx-auto my-2 md:my-4 flex flex-col items-center gap-2 not-prose">
        <Href href="https://twitter.com/RoscoKalis/status/1183412994375503872" underline="none" external>
          <Image
            src="/assets/images/about/revoke-tweet.png"
            alt="Initial Revoke.cash Tweet"
            height="1000"
            width="1500"
            className="rounded-lg border border-black dark:border-white"
            priority
            fetchPriority="high"
          />
        </Href>
        <figcaption className="text-base leading-none text-zinc-600 dark:text-zinc-400">
          {t('about.captions.first_tweet')}
        </figcaption>
      </div>

      <p>
        <RichText>{(tags) => t.rich('about.body.growth', tags)}</RichText>
      </p>

      <div className="mx-auto my-2 md:my-4 flex flex-col items-center gap-2 not-prose">
        <Image
          src="/assets/images/about/revoke-team.png"
          alt="Revoke.cash Team"
          height="720"
          width="1280"
          className="rounded-lg border border-black dark:border-white"
        />
        <figcaption className="text-base leading-none text-zinc-600 dark:text-zinc-400">
          {t('about.captions.team')}
        </figcaption>
      </div>

      <p>{t('about.body.team')}</p>

      <p>
        <RichText>{(tags) => t.rich('about.body.learn_more', tags)}</RichText>
      </p>
    </ProseLayout>
  );
};

export default AboutPage;
