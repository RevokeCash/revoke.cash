import {
  AUTO_REVOKE_MAX_ACTION_COST_USD,
  AUTO_REVOKE_MONTHLY_GAS_BUDGET_USD,
  AUTO_REVOKE_SUPPORTED_CHAINS,
} from '@revoke.cash/core/auto-revoke/config';
import { getChainName } from '@revoke.cash/core/chains';
import Button from 'components/common/Button';
import ChainLogo from 'components/common/ChainLogo';
import ContentPageHero from 'components/common/ContentPageHero';
import Href from 'components/common/Href';
import { useTranslations } from 'next-intl';

const AutomatedRevokingPageContent = () => {
  const t = useTranslations();

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-12">
      <ContentPageHero
        title={t('premium.automated_revoking.title')}
        subtitle={t('premium.automated_revoking.description')}
      />

      <div className="flex flex-col gap-8">
        <h2 className="text-3xl font-bold text-center">{t('premium.automated_revoking.steps.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Step number={1} stepKey="permission" />
          <Step number={2} stepKey="rules" />
          <Step number={3} stepKey="monitoring" />
          <Step number={4} stepKey="execution" />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="text-3xl font-bold text-center">{t('premium.automated_revoking.networks.title')}</h2>
        <p className="mx-auto max-w-3xl text-center text-base leading-7 text-zinc-600 dark:text-zinc-400">
          {t('premium.automated_revoking.networks.description', { count: AUTO_REVOKE_SUPPORTED_CHAINS.length })}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {AUTO_REVOKE_SUPPORTED_CHAINS.map((chainId) => (
            <div
              key={chainId}
              className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 px-4 py-2"
            >
              <ChainLogo chainId={chainId} size={24} />
              <span className="text-base font-medium">{getChainName(chainId)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="text-3xl font-bold text-center">{t('premium.automated_revoking.gas.title')}</h2>
        <p className="mx-auto max-w-3xl text-center text-base leading-7 text-zinc-600 dark:text-zinc-400">
          {t('premium.automated_revoking.gas.description', {
            budget: `$${AUTO_REVOKE_MONTHLY_GAS_BUDGET_USD}`,
            cap: `$${AUTO_REVOKE_MAX_ACTION_COST_USD}`,
          })}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="text-3xl font-bold text-center">{t('premium.automated_revoking.limitations.title')}</h2>
        <p className="mx-auto max-w-3xl text-center text-base leading-7 text-zinc-600 dark:text-zinc-400">
          {t.rich('premium.automated_revoking.limitations.description', {
            'terms-link': (children) => (
              <Href href="/terms" router underline="always">
                {children}
              </Href>
            ),
          })}
        </p>
      </div>

      <div className="flex flex-col items-center gap-6 pb-8">
        <h2 className="text-3xl font-bold text-center">{t('premium.automated_revoking.cta.title')}</h2>
        <Button href="/premium" router style="primary" size="lg">
          {t('premium.automated_revoking.cta.button')}
        </Button>
      </div>
    </div>
  );
};

interface StepProps {
  number: number;
  stepKey: 'permission' | 'rules' | 'monitoring' | 'execution';
}

const Step = ({ number, stepKey }: StepProps) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand font-bold text-zinc-900">
          {number}
        </div>
        <h3 className="text-xl font-semibold">{t(`premium.automated_revoking.steps.${stepKey}.title`)}</h3>
      </div>
      <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
        {t(`premium.automated_revoking.steps.${stepKey}.description`)}
      </p>
    </div>
  );
};

export default AutomatedRevokingPageContent;
