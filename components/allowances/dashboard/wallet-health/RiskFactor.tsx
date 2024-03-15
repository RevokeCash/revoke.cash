import Href from 'components/common/Href';
import Trans from 'next-translate/Trans';
import useTranslation from 'next-translate/useTranslation';

interface Props {
  name: string;
  type?: string;
}

interface BlockListPlatform {
  name: string;
  url: string;
}

const RiskFactor = ({ name, type }: Props) => {
  const { t } = useTranslation();

  const blocklistPlatforms: Record<string, BlockListPlatform> = {
    scamsniffer_blocklist: {
      name: 'ScamSniffer',
      url: 'https://scamsniffer.io/',
    },
  };

  const platform = blocklistPlatforms[name];

  if (name.includes('blocklist') && !!platform) {
    return (
      <Trans
        i18nKey="address:risk_factors.blocklist"
        values={{ platform: platform.name }}
        components={[<Href href={platform.url} external />]}
      />
    );
  }

  if (type === 'exploit') {
    return t('address:risk_factors.exploit', { exploit: name });
  }

  return name;
};

export default RiskFactor;
