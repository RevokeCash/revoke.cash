import { useTranslations } from 'next-intl';
import FullWidthLandingSection from './FullWidthLandingSection';

const StatsBar = () => {
  const t = useTranslations();

  return (
    <FullWidthLandingSection inverted>
      <div className="grid w-full gap-4 md:grid-cols-4">
        <StatsBarItem value="$140M+" label={t('landing.stats.protected_from_exploits')} />
        <StatsBarItem value="2M+" label={t('landing.stats.total_users')} />
        <StatsBarItem value="20M+" label={t('landing.stats.approvals_revoked')} />
        <StatsBarItem value="100+" label={t('landing.stats.networks_supported')} />
      </div>
    </FullWidthLandingSection>
  );
};

export default StatsBar;

interface StatsBarItemProps {
  value: string;
  label: string;
}

const StatsBarItem = ({ value, label }: StatsBarItemProps) => {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 px-4 py-5 text-center">
      <div className="text-3xl font-semibold text-brand md:text-4xl">{value}</div>
      <span className="mt-2 text-sm text-zinc-400">{label}</span>
    </div>
  );
};
