import Href from 'components/common/Href';
import { RiskFactor } from 'lib/interfaces';
import { useTranslations } from 'next-intl';

interface Props {
  riskFactor: RiskFactor;
}

interface DataSourceLink {
  name: string;
  url?: string;
}

const SOURCES: Record<string, DataSourceLink> = {
  scamsniffer: {
    name: 'ScamSniffer',
    url: 'https://scamsniffer.io/',
  },
  webacy: {
    name: 'Webacy',
    url: 'https://webacy.com/',
  },
  harpie: {
    name: 'Harpie',
    url: 'https://harpie.io/',
  },
  nefture: {
    name: 'Nefture',
    url: 'https://nefture.com/',
  },
  revoke: {
    name: 'Revoke.cash',
  },
};

const RiskFactorDisplay = ({ riskFactor }: Props) => {
  const t = useTranslations();

  const source = SOURCES[riskFactor.source];

  const richDisplay = t.rich(`address.risk_factors.${riskFactor.type}`, {
    type: riskFactor.type,
    source: source?.name ?? riskFactor.source,
    data: riskFactor.data,
    'source-link': (children) =>
      source?.url ? (
        <Href href={source.url} external className="font-medium">
          {children}
        </Href>
      ) : (
        <span className="font-medium">{children}</span>
      ),
  });

  if (richDisplay !== `address.risk_factors.${riskFactor.type}`) return richDisplay;

  return null;
};

export default RiskFactorDisplay;
