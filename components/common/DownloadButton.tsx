import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import Button from './Button';

interface Props {
  href: string;
  children: ReactNode;
}

const DownloadButton = ({ href, children }: Props) => {
  const t = useTranslations();

  return (
    <Button href={href} style="secondary" size="md" className="flex justify-center items-center gap-2" external>
      <div>{t('common.buttons.download')}</div>
      <div className="flex gap-1">{children}</div>
    </Button>
  );
};

export default DownloadButton;
