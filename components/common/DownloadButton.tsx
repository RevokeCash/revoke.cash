import useTranslation from 'next-translate/useTranslation';
import React, { ReactNode } from 'react';
import { Button } from 'react-bootstrap';

interface Props {
  href: string;
  children: ReactNode;
}

const DownloadButton = ({ href, children }: Props) => {
  const { t } = useTranslation();

  return (
    <Button
      href={href}
      target="_blank"
      variant="outline-primary"
      style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
    >
      <div>{t('common:buttons.download')}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '5px' }}>
        {children}
      </div>
    </Button>
  );
};

export default DownloadButton;
