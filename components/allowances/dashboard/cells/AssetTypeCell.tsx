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
    assetType === 'NFT' ? 'bg-zinc-200 dark:bg-zinc-800' : 'bg-zinc-300 dark:bg-zinc-700',
  );

  return (
    <div className="flex justify-start">
      <Label className={classes}>{t(`address.labels.${assetType.toLowerCase()}`)}</Label>
    </div>
  );
};

export default AssetTypeCell;
