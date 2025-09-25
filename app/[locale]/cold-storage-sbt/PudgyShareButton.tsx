import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Button from 'components/common/Button';
import { useTranslations } from 'next-intl';

const PudgyShareButton = () => {
  const t = useTranslations();

  // TODO: Add video when it's ready
  const INTENT_URL =
    'https://twitter.com/intent/post?text=I%20just%20minted%20my%20Pudgy%20Penguins%20x%20Revoke.cash%20Cold%20Storage%20Soulbound%20Token%2C%20showing%20that%20I%20understand%20the%20importance%20of%20cold%20wallets%20and%20managing%20token%20approvals!%0A%0AGet%20yours%20on%20revoke.cash%2Fcold-storage-sbt';

  return (
    <Button style="primary" size="md" className="flex items-center gap-2" href={INTENT_URL} external>
      {t('common.buttons.share_on_x')} <ArrowTopRightOnSquareIcon className="w-4 h-4 text-zinc-400" />
    </Button>
  );
};

export default PudgyShareButton;
