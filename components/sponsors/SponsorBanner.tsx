import Href from 'components/common/Href';
import Label from 'components/common/Label';
import { track } from 'lib/utils/analytics';
import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';
import { useState } from 'react';
import { twMerge } from 'tailwind-merge';

interface Props {
  name: string;
  banner: string;
  url: string;
  tier: 'gold' | 'silver' | 'bronze';
  overlay?: Overlay;
}

interface Overlay {
  url: string;
  top: number | string;
  left: number | string;
  width: number | string;
  height: number | string;
}

const SponsorBanner = ({ name, banner, url, tier, overlay }: Props) => {
  const { t } = useTranslation();
  const [error, setError] = useState<boolean>(false);

  if (error) return null;

  const mapping = {
    common: {
      label:
        'absolute -top-1 left-2 z-10 border border-black text-zinc-900 font-semibold flex items-center justify-center rounded-md',
      banner: 'flex flex-col items-center',
      image: 'rounded-lg border border-black dark:border-white object-cover aspect-[3/1] overflow-hidden w-full',
    },
    bronze: {
      label: 'bg-amber-600 text-[0.65rem] px-1.5 py-px',
      banner: '',
      image: '',
      img: {
        width: 192,
        height: 64,
      },
    },
    silver: {
      label: 'bg-slate-300',
      banner: '',
      image: '',
      img: {
        width: 256,
        height: 85,
      },
    },
    gold: {
      label: 'bg-yellow-500',
      banner: '',
      image: '',
      img: {
        width: 384,
        height: 128,
      },
    },
  };

  const trackClick = () => {
    track('Sponsor Link Clicked', { name, tier, url });
  };

  return (
    <div className="relative">
      <Href
        href={url}
        external
        className={twMerge(mapping.common.banner, mapping[tier].banner)}
        underline="hover"
        onClick={trackClick}
      >
        <div className={twMerge(mapping.common.image, mapping[tier].image)}>
          <Label className={twMerge(mapping.common.label, mapping[tier].label)}>
            {t(`landing:sponsors.tiers.${tier}`)}
          </Label>
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
        <Href
          href={overlay.url}
          style={overlay}
          className="absolute"
          external
          onClick={trackClick}
          aria-label={`${name} Overlay Link`}
        />
      )}
    </div>
  );
};

export default SponsorBanner;
