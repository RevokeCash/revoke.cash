'use client';

import Label from 'components/common/Label';
import { useMounted } from 'lib/hooks/useMounted';
import { useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';
import { useAccount } from 'wagmi';

interface Props {
  address: string;
}

const ConnectedLabel = ({ address }: Props) => {
  const isMounted = useMounted();
  const t = useTranslations();
  const { address: account } = useAccount();

  const classes = twMerge(
    address === account
      ? 'bg-green-400 text-zinc-900'
      : 'bg-zinc-300 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-100',
  );

  // Add placeholder label to prevent layout shift
  if (!isMounted) return <Label className="bg-transparent">&nbsp;</Label>;

  return (
    <Label className={classes}>
      {address === account ? t('address.labels.connected') : t('address.labels.not_connected')}
    </Label>
  );
};

export default ConnectedLabel;
