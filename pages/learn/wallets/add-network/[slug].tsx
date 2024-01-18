import Button from 'components/common/Button';
import ChainDescription from 'components/common/ChainDescription';
import ChainSelectHref from 'components/common/ChainSelectHref';
import CopyButton from 'components/common/CopyButton';
import Prose from 'components/common/Prose';
import ConnectButton from 'components/header/ConnectButton';
import LearnLayout from 'layouts/LearnLayout';
import { useMounted } from 'lib/hooks/useMounted';
import { ISidebarEntry } from 'lib/interfaces';
import { defaultSEO } from 'lib/next-seo.config';
import {
  SUPPORTED_CHAINS,
  getChainExplorerUrl,
  getChainFreeRpcUrl,
  getChainIdFromSlug,
  getChainName,
  getChainNativeToken,
  getChainSlug,
} from 'lib/utils/chains';
import { getSidebar } from 'lib/utils/markdown-content';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';
import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';
import { useAccount, useSwitchNetwork } from 'wagmi';

interface Props {
  sidebar: ISidebarEntry[];
  chainId: number;
}

const AddNewChainPage: NextPage<Props> = ({ sidebar, chainId }) => {
  const { t, lang } = useTranslation();
  const { switchNetwork } = useSwitchNetwork({ chainId });
  const { isConnected } = useAccount();
  const isMounted = useMounted();

  const chainName = getChainName(chainId);
  const slug = ['wallets', 'add-network'];

  const meta = {
    title: t('learn:add_network.title', { chainName }),
    sidebarTitle: t('learn:add_network.title', { chainName }),
    description: t('learn:add_network.description', { chainName }),
    language: lang,
    coverImage: encodeURI(`/api/og?background=ADD_NETWORK&text=${t('learn:add_network.title', { chainName })}`),
  };

  return (
    <>
      <NextSeo
        {...defaultSEO}
        title={meta.title}
        description={meta.description}
        openGraph={{
          ...defaultSEO.openGraph,
          images: [{ url: `https://revoke.cash${meta.coverImage}`, width: 1600, height: 900 }],
        }}
      />
      <LearnLayout sidebarEntries={sidebar} slug={slug} meta={meta}>
        <Prose vocab="https://schema.org/" typeof="HowTo">
          <h1 property="name">{meta.title}</h1>
          <meta property="description" content={meta.description} />
          <div className="flex flex-col sm:flex-row items-center gap-2 my-4">
            <p className="m-0">{t('learn:add_network.select_network')}</p>
            <div className="not-prose shrink-0">
              <ChainSelectHref
                selected={chainId}
                getUrl={(chainId) => `/learn/wallets/add-network/${getChainSlug(chainId)}`}
              />
            </div>
          </div>
          <ChainDescription chainId={chainId} headingElement="h2" />
          <h2>{t('learn:add_network.steps_heading', { chainName })}</h2>
          <p>{t('learn:add_network.intro_paragraph', { chainName })}</p>
          <div property="step" typeof="HowToStep">
            <h3 property="name">{t('learn:add_network.step_1.title')}</h3>
            <meta property="text" content={t('learn:add_network.step_1.title')} />
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
          <div property="step" typeof="HowToStep">
            <h3 property="name">{t('learn:add_network.step_2.title')}</h3>
            <div property="text">
              <p>{t('learn:add_network.step_2.paragraph_1', { chainName })}</p>
              <div className="flex flex-col gap-1 my-4">
                <FormElement label="Network name" content={chainName} />
                <FormElement label="New RPC URL" content={getChainFreeRpcUrl(chainId)} />
                <FormElement label="Chain ID" content={String(chainId)} />
                <FormElement label="Currency symbol" content={getChainNativeToken(chainId)} />
                <FormElement label="Block explorer URL (Optional)" content={getChainExplorerUrl(chainId)} />
              </div>
              <p>{t('learn:add_network.step_2.paragraph_2')}</p>
              {isConnected && isMounted ? (
                <Button style="primary" size="md" onClick={() => switchNetwork()}>
                  {meta.title}
                </Button>
              ) : (
                <ConnectButton style="primary" size="md" />
              )}
            </div>
          </div>
        </Prose>
      </LearnLayout>
    </>
  );
};

const FormElement = ({ label, content }: { label: string; content: string }) => {
  return (
    <>
      <div className="font-bold">{label}</div>
      <div className="w-full max-w-sm border px-2 py-2 border-zinc-400 dark:border-zinc-500 rounded-md text-sm flex justify-between gap-4">
        <span className="truncate">{content}</span>
        <CopyButton content={content} />
      </div>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ params, locale }) => {
  const sidebar = await getSidebar(locale, 'learn');
  const chainId = getChainIdFromSlug(params.slug as string);

  return {
    props: {
      sidebar,
      chainId,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async ({ locales }) => {
  const slugs = SUPPORTED_CHAINS.map(getChainSlug);

  const paths = locales.flatMap((locale) =>
    slugs.map((slug) => ({
      params: { slug },
      locale,
    })),
  );

  return {
    paths,
    fallback: false,
  };
};

export default AddNewChainPage;
