import Label from 'components/common/Label';
import { useLocale, useTranslations } from 'next-intl';
import { twMerge } from 'tailwind-merge';

interface Props {
  assetType: 'NFT' | 'Token';
}

const AssetTypeCell = ({ assetType }: Props) => {
  const t = useTranslations();
  const locale = useLocale();

  const classes = twMerge(
    locale === 'ja' ? 'w-16' : 'w-12',
    assetType === 'NFT' ? 'bg-blue-400 text-zinc-900' : 'bg-yellow-400 text-zinc-900',
  );

  return (
    <div className="flex justify-start">
      <Label className={classes}>{t(`address.labels.${assetType.toLowerCase()}`)}</Label>
    </div>
  );
};

export default AssetTypeCell;
