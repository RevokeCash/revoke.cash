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
};

const RiskFactorDisplay = ({ riskFactor }: Props) => {
  const t = useTranslations();

  const riskFactorText = t(`address.risk_factors.${riskFactor.type}`, {
    type: riskFactor.type,
    data: riskFactor.data,
  });

  if (riskFactorText === `address.risk_factors.${riskFactor.type}`) return null;

  const source = SOURCES[riskFactor.source];
  if (!source) return riskFactorText;

  const sourceDisplay = t.rich(`address.risk_factors.source`, {
    source: source?.name ?? riskFactor.source,
    'source-link': (children) =>
      source?.url ? (
        <Href href={source.url} external className="font-medium">
          {children}
        </Href>
      ) : (
        <span className="font-medium">{children}</span>
      ),
  });

  return (
    <>
      {riskFactorText} ({sourceDisplay})
    </>
  );
};

export default RiskFactorDisplay;
