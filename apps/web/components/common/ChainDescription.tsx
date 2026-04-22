import { isNullish } from 'lib/utils';
import {
  CHAIN_SELECT_TESTNETS,
  getChainInfoUrl,
  getChainName,
  getChainNativeToken,
  getChainSlug,
  getCorrespondingMainnetChainId,
} from 'lib/utils/chains';
import { useTranslations } from 'next-intl';
import { createElement } from 'react';
import Href from './Href';
import RichText from './RichText';

interface Props {
  chainId: number;
  headingElement?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const ChainDescription = ({ chainId, headingElement }: Props) => {
  const t = useTranslations();

  const mainnetChainId = getCorrespondingMainnetChainId(chainId) ?? chainId;
  const isTestnet = CHAIN_SELECT_TESTNETS.includes(chainId);
  const isCanary = !isTestnet && chainId !== mainnetChainId;

  const mainnetChainSlug = getChainSlug(mainnetChainId);
  const mainnetChainName = getChainName(mainnetChainId).replace(' (Unsupported)', '');
  const chainName = getChainName(chainId).replace(' (Unsupported)', '');
  const nativeToken = getChainNativeToken(chainId);
  const infoUrl = getChainInfoUrl(chainId);

  const hasDescription = t(`networks.networks.${mainnetChainSlug}`) !== `networks.networks.${mainnetChainSlug}`;
  if (!hasDescription) return null;

  return (
    <>
      {!isNullish(headingElement) && createElement(headingElement, {}, t('networks.title', { chainName }))}
      <p>
        {isTestnet && <span>{t('networks.is_testnet', { chainName, mainnetChainName })} </span>}
        <span>
          {isCanary
            ? t('networks.canary_network', { chainName, mainnetChainName })
            : t(`networks.networks.${mainnetChainSlug}`)}{' '}
          {t('networks.native_token', { chainName, nativeToken })}
          {infoUrl && (
            <>
              {' '}
              <RichText>
                {(tags) =>
                  t.rich('networks.learn_more', {
                    ...tags,
                    chainName,
                    'info-link': (children) => (
                      <Href href={infoUrl} underline="hover" html external>
                        {children}
                      </Href>
                    ),
                  })
                }
              </RichText>
            </>
          )}
        </span>
      </p>
    </>
  );
};

export default ChainDescription;
