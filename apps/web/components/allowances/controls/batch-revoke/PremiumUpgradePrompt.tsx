import Href from 'components/common/Href';
import { useTranslations } from 'next-intl';

const PremiumUpgradePrompt = () => {
  const t = useTranslations();

  return (
    <div className="text-center text-xs text-zinc-500 dark:text-zinc-400">
      {t('address.batch_revoke.fee.upgrade_prompt')}{' '}
      <Href href="/premium" className="font-medium text-zinc-700 dark:text-zinc-200" router>
        {t('common.buttons.upgrade_to_premium')}
      </Href>
    </div>
  );
};

export default PremiumUpgradePrompt;
