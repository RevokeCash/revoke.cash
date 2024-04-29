import ProseLayout from 'app/layouts/ProseLayout';
import Divider from 'components/common/Divider';
import Href from 'components/common/Href';
import type { Metadata, NextPage } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import Image from 'next/image';

interface Props {
  params: {
    locale: string;
  };
}

export const generateMetadata = async ({ params: { locale } }): Promise<Metadata> => {
  const t = await getTranslations({ locale });

  return {
    title: t('about.meta.title'),
    description: t('about.meta.description'),
  };
};

const AboutPage: NextPage<Props> = ({ params }) => {
  unstable_setRequestLocale(params.locale);
  const t = useTranslations();

  return (
    <ProseLayout>
      <h1>{t('about.title')}</h1>
      <Divider className="my-4" />

      <p>{t.rich('about.body.intro')}</p>

      <div className="mx-auto max-w-2xl my-2 md:my-4 flex flex-col items-center gap-2 not-prose">
        <Href href="https://twitter.com/RoscoKalis/status/1183412994375503872" underline="none" external>
          <Image
            src="/assets/images/about/revoke-tweet.png"
            alt="Initial Revoke.cash Tweet"
            height="1000"
            width="1500"
            className="rounded-2xl border border-black dark:border-white"
            priority
            fetchPriority="high"
          />
        </Href>
        <figcaption className="text-base leading-none text-zinc-600 dark:text-zinc-400">
          {t('about.captions.first_tweet')}
        </figcaption>
      </div>

      <p>{t.rich('about.body.growth')}</p>

      <div className="mx-auto max-w-2xl my-4 md:my-8 flex flex-col items-center gap-2 not-prose">
        <Image
          src="/assets/images/about/revoke-team.png"
          alt="Revoke.cash Team"
          height="900"
          width="1400"
          className="rounded-2xl border border-black dark:border-white"
        />
        <figcaption className="text-base leading-none text-zinc-600 dark:text-zinc-400">
          {t('about.captions.team')}
        </figcaption>
      </div>

      <p>{t('about.body.team')}</p>

      <p>{t.rich('about.body.learn_more')}</p>
    </ProseLayout>
  );
};

export default AboutPage;
