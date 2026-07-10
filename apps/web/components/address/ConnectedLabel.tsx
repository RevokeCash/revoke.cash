'use client';

import Label from 'components/common/Label';
import StatusLabel from 'components/common/StatusLabel';
import { useMounted } from 'lib/hooks/useMounted';
import { useTranslations } from 'next-intl';
import { useConnection } from 'wagmi';

interface Props {
  address: string;
}

const ConnectedLabel = ({ address }: Props) => {
  const isMounted = useMounted();
  const t = useTranslations();
  const { address: account } = useConnection();

  // Add placeholder label to prevent layout shift
  if (!isMounted) return <Label className="bg-transparent">&nbsp;</Label>;

  return (
    <StatusLabel status={address === account ? 'success' : 'neutral'}>
      {address === account ? t('address.labels.connected') : t('address.labels.not_connected')}
    </StatusLabel>
  );
};

export default ConnectedLabel;
