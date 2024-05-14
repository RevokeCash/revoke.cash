import LearnLayout from 'app/layouts/LearnLayout';
import ChainDescription from 'components/common/ChainDescription';
import Divider from 'components/common/Divider';
import Prose from 'components/common/Prose';
import NextIntlClientProvider from 'lib/i18n/NextIntlClientProvider';
import { locales } from 'lib/i18n/config';
import { SUPPORTED_CHAINS, getChainIdFromSlug, getChainName, getChainSlug } from 'lib/utils/chains';
import { getSidebar } from 'lib/utils/markdown-content';
import { Metadata, NextPage } from 'next';
import { getMessages, getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import Image from 'next/image';
import AddNetworkChainSelect from './AddNetworkChainSelect';
import AddNetworkForm from './AddNetworkForm';

interface Props {
  params: { locale: string; slug: string };
}

export const generateStaticParams = () => {
  const slugs = SUPPORTED_CHAINS.map(getChainSlug);
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
};

export const generateMetadata = async ({ params: { locale, slug } }): Promise<Metadata> => {
  const t = await getTranslations({ locale });
  const chainId = getChainIdFromSlug(slug);
  const chainName = getChainName(chainId);

  return {
    title: t('learn.add_network.title', { chainName }),
    description: t('learn.add_network.description', { chainName }),
    openGraph: {
      images: `/assets/images/generated/${locale}/learn/wallets/add-network/${slug}/og.jpg`,
    },
  };
};

const AddNewChainPage: NextPage<Props> = async ({ params }) => {
  unstable_setRequestLocale(params.locale);

  const chainId = getChainIdFromSlug(params.slug as string);
  const sidebar = await getSidebar(params.locale, 'learn');
  const t = await getTranslations({ locale: params.locale });
  const messages = await getMessages();

  const chainName = getChainName(chainId);
  const slug = ['wallets', 'add-network'];

  const meta = {
    title: t('learn.add_network.title', { chainName }),
    sidebarTitle: t('learn.add_network.title', { chainName }),
    description: t('learn.add_network.description', { chainName }),
    language: params.locale,
    coverImage: `/assets/images/generated/${params.locale}/learn/wallets/add-network/${params.slug}/og.jpg`,
  };

  return (
    <LearnLayout sidebarEntries={sidebar} slug={slug} meta={meta}>
      <Prose vocab="https://schema.org/" typeof="HowTo">
        <h1 property="name">{meta.title}</h1>
        <Divider className="my-4" />
        <div hidden className="hidden" property="description" content={meta.description} />
        <div className="flex flex-col sm:flex-row items-center gap-2 my-4">
          <p className="m-0">{t('learn.add_network.select_network')}</p>
          <div className="not-prose shrink-0">
            <AddNetworkChainSelect chainId={chainId} />
          </div>
        </div>
        <ChainDescription chainId={chainId} headingElement="h2" />
        <h2>{t('learn.add_network.steps_heading', { chainName })}</h2>
        <p>{t('learn.add_network.intro_paragraph', { chainName })}</p>
        <div property="step" typeof="HowToStep">
          <h3 property="name">{t('learn.add_network.step_1.title')}</h3>
          <div hidden className="hidden" property="text" content={t('learn.add_network.step_1.title')} />
          <div className="flex flex-col sm:flex-row gap-x-4 max-sm:max-w-sm">
            <p>
              <Image
                src="/assets/images/learn/wallets/add-network/metamask-add-network-1.png"
                alt="MetaMask Add Network 1"
                width={712}
                height={784}
                property="image"
                priority
                fetchPriority="high"
              />
            </p>
            <p>
              <Image
                src="/assets/images/learn/wallets/add-network/metamask-add-network-2.png"
                alt="MetaMask Add Network 2"
                width={712}
                height={784}
                property="image"
                priority
                fetchPriority="high"
              />
            </p>
          </div>
        </div>
        <NextIntlClientProvider messages={{ learn: messages.learn, common: messages.common }}>
          <AddNetworkForm chainId={chainId} />
        </NextIntlClientProvider>
      </Prose>
    </LearnLayout>
  );
};

export default AddNewChainPage;
