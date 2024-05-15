import { ShareIcon } from '@heroicons/react/24/solid';
import { writeToClipBoard } from 'lib/utils';
import { useTranslations } from 'next-intl';
import Button from './Button';

const ShareButton = () => {
  const t = useTranslations();
  return (
    <Button
      style="tertiary"
      size="none"
      onClick={() => writeToClipBoard(location.href, t)}
      aria-label="Share This Page On Social Media"
    >
      <ShareIcon className="w-5 h-5" />
    </Button>
  );
};

export default ShareButton;
