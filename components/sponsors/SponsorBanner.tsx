import Href from 'components/common/Href';
import Label from 'components/common/Label';
import { classNames } from 'lib/utils/styles';
import useTranslation from 'next-translate/useTranslation';
import { useState } from 'react';

interface Props {
  name: string;
  banner: string;
  url: string;
  tier: 'gold' | 'silver' | 'bronze';
}

const SponsorBanner = ({ name, banner, url, tier }: Props) => {
  const { t } = useTranslation();
  const [error, setError] = useState<boolean>(false);

  if (error) return null;

  const classMapping = {
    common: {
      container: 'relative',
      label: 'absolute -top-1 left-2 bg-black border font-semibold flex items-center justify-center rounded-md',
      banner: 'flex flex-col items-center',
      image: 'rounded-lg border border-black dark:border-white object-cover aspect-[3/1]',
      name: '',
    },
    bronze: {
      container: '',
      label: 'border-amber-600 text-amber-600 text-[0.6rem] px-0.5 py-0',
      banner: '',
      image: 'w-48',
      name: '',
    },
    silver: {
      container: '',
      label: 'border-slate-400 text-slate-400',
      banner: '',
      image: 'w-60',
      name: '',
    },
    gold: {
      container: '',
      label: 'border-yellow-500 text-yellow-500',
      banner: '',
      image: 'w-80',
      name: '',
    },
  };

  return (
    <div className={classNames(classMapping.common.container, classMapping[tier].container)}>
      <Label className={classNames(classMapping.common.label, classMapping[tier].label)}>
        {t(`landing:sponsors.tiers.${tier}`)}
      </Label>
      <Href
        href={url}
        external
        className={classNames(classMapping.common.banner, classMapping[tier].banner)}
        underline="hover"
      >
        <img
          src={banner}
          alt={name}
          className={classNames(classMapping.common.image, classMapping[tier].image)}
          onError={() => setError(true)}
        />
        <div className={classNames(classMapping.common.name, classMapping[tier].name)}>{name}</div>
      </Href>
    </div>
  );
};

export default SponsorBanner;
