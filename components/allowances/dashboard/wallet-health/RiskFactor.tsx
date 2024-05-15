import Href from 'components/common/Href';
import { useTranslations } from 'next-intl';

interface Props {
  name: string;
  type?: string;
}

interface BlockListPlatform {
  name: string;
  url: string;
}

const RiskFactor = ({ name, type }: Props) => {
  const t = useTranslations();

  const blocklistPlatforms: Record<string, BlockListPlatform> = {
    scamsniffer_blocklist: {
      name: 'ScamSniffer',
      url: 'https://scamsniffer.io/',
    },
  };

  const platform = blocklistPlatforms[name];

  if (name.includes('blocklist') && !!platform) {
    return t.rich('address.risk_factors.blocklist', {
      platform: platform.name,
      'blocklist-link': (children) => (
        <Href href={platform.url} external>
          {children}
        </Href>
      ),
    });
  }

  if (type === 'exploit') {
    return t('address.risk_factors.exploit', { exploit: name });
  }

  return name;
};

export default RiskFactor;
