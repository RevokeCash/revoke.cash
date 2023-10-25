import AddressSearchBox from 'components/common/AddressSearchBox';
import ChainDescription from 'components/common/ChainDescription';
import ChainLogo from 'components/common/ChainLogo';
import ChainSelectHref from 'components/common/ChainSelectHref';
import Href from 'components/common/Href';
import Prose from 'components/common/Prose';
import LandingLayout from 'layouts/LandingLayout';
import { defaultSEO } from 'lib/next-seo.config';
import { SUPPORTED_CHAINS, getChainIdFromSlug, getChainName, getChainSlug } from 'lib/utils/chains';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { NextSeo } from 'next-seo';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';
import { useState } from 'react';

interface Props {
  chainId: number;
}

const AddNewChainPage: NextPage<Props> = ({ chainId }) => {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const [value, setValue] = useState<string>('');

  const chainName = getChainName(chainId);

  const query: any = { ...router.query, chainId };
  delete query.slug;

  return (
    <>
      <NextSeo
        {...defaultSEO}
        title={t('token_approval_checker:meta.title', { chainName })}
        description={t('common:meta.description', { chainName })}
      />
      <LandingLayout searchBar={false}>
        <div className="flex flex-col items-center m-auto gap-4 px-4">
          <div className="flex flex-col items-center w-full">
            <h1 className="text-4xl md:text-5xl not-prose items-center gap-2 mb-12 text-center">
              <ChainLogo chainId={chainId} size={36} className="inline align-middle" />{' '}
              <div className="inline align-middle">{t('token_approval_checker:title', { chainName })}</div>
            </h1>
            <AddressSearchBox
              onSubmit={() => router.push({ pathname: `/address/${value}`, query })}
              onChange={(ev) => setValue(ev.target.value.trim())}
              value={value}
              placeholder={t('common:nav.search')}
              className="w-full max-w-3xl text-base sm:text-lg"
            />
            <div className="flex flex-col sm:flex-row items-center gap-2 my-4">
              <p className="m-0">{t('token_approval_checker:different_chain')}:</p>
              <div className="not-prose shrink-0">
                <ChainSelectHref
                  selected={chainId}
                  getUrl={(chainId) => `/token-approval-checker/${getChainSlug(chainId)}`}
                />
              </div>
            </div>
          </div>
          <Prose className="flex flex-col items-center max-w-3xl">
            <div>
              <ChainDescription chainId={chainId} headingElement="h2" />
            </div>
            <div>
              <h2>{t('token_approval_checker:what_are_token_approvals.title', { chainName })}</h2>
              <p>
                <Trans
                  i18nKey="token_approval_checker:what_are_token_approvals.content"
                  values={{ chainName }}
                  components={[<Href href="/learn/approvals/what-are-token-approvals" html underline="hover" router />]}
                />
              </p>
            </div>
            <div>
              <h2>{t('token_approval_checker:how_to_revoke.title', { chainName })}</h2>
              <p>
                <Trans
                  i18nKey="token_approval_checker:how_to_revoke.content"
                  values={{ chainName }}
                  components={[
                    <Href href="/learn/approvals/how-to-revoke-token-approvals" html underline="hover" router />,
                  ]}
                />
              </p>
            </div>
          </Prose>
        </div>
      </LandingLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const chainId = getChainIdFromSlug(params.slug as string);

  return {
    props: {
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
