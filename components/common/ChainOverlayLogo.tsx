import { twMerge } from 'tailwind-merge';
import ChainLogo from './ChainLogo';
import Logo from './Logo';

interface Props {
  src?: string;
  alt: string;
  chainId?: number;
  size?: number;
  overlaySize?: number;
}

const ChainOverlayLogo = ({ src, alt, chainId, size, overlaySize }: Props) => {
  return (
    <div className={twMerge('relative shrink-0', chainId && 'ml-1')}>
      <Logo src={src} alt={alt} size={size} border />
      {chainId && (
        <div className="absolute inset-0 -left-3">
          <ChainLogo chainId={chainId} size={overlaySize ?? 16} />
        </div>
      )}
    </div>
  );
};

export default ChainOverlayLogo;
