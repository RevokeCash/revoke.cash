import Href from 'components/common/Href';
import Label from 'components/common/Label';
import { classNames } from 'lib/utils/styles';
import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';
import { useState } from 'react';

interface Props {
  name: string;
  banner: string;
  url: string;
  tier: 'gold' | 'silver' | 'bronze';
  overlay?: Overlay;
}

interface Overlay {
  url: string;
  top: number;
  left: number;
  width: number;
  height: number;
}

const SponsorBanner = ({ name, banner, url, tier, overlay }: Props) => {
  const { t } = useTranslation();
  const [error, setError] = useState<boolean>(false);

  if (error) return null;

  const mapping = {
    common: {
      label:
        'absolute -top-1 left-2 z-10 border border-black text-black font-semibold flex items-center justify-center rounded-md',
      banner: 'flex flex-col items-center',
      image: 'rounded-lg border border-black dark:border-white object-cover aspect-[3/1] overflow-hidden',
    },
    bronze: {
      label: 'bg-amber-600 text-[0.65rem] px-1 py-px',
      banner: '',
      image: 'w-48',
      img: {
        width: 192,
        height: 64,
      },
    },
    silver: {
      label: 'bg-slate-300',
      banner: '',
      image: 'w-64',
      img: {
        width: 256,
        height: 85,
      },
    },
    gold: {
      label: 'bg-yellow-500',
      banner: '',
      image: 'w-96',
      img: {
        width: 384,
        height: 128,
      },
    },
  };

  return (
    <div className="relative">
      <Label className={classNames(mapping.common.label, mapping[tier].label)}>
        {t(`landing:sponsors.tiers.${tier}`)}
      </Label>
      <Href href={url} external className={classNames(mapping.common.banner, mapping[tier].banner)} underline="hover">
        <div className={classNames(mapping.common.image, mapping[tier].image)}>
          <Image
            src={banner}
            alt={name}
            className="object-cover"
            onError={() => setError(true)}
            width={mapping[tier].img.width}
            height={mapping[tier].img.height}
          />
        </div>
        <div>{name}</div>
      </Href>
      {overlay && (
        <Href href={overlay.url} external>
          <div style={overlay} className="absolute" />
        </Href>
      )}
    </div>
  );
};

export default SponsorBanner;
