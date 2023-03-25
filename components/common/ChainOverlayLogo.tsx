import ChainLogo from './ChainLogo';
import Logo from './Logo';

interface Props {
  src: string;
  alt: string;
  chainId?: number;
  size?: number;
  overlaySize?: number;
}

const ChainOverlayLogo = ({ src, alt, chainId, size, overlaySize }: Props) => {
  return (
    <div className="relative">
      <Logo src={src} alt={alt} size={size} />
      <div className="absolute inset-0 -left-1">
        <ChainLogo chainId={chainId} size={overlaySize ?? 12} />
      </div>
    </div>
  );
};

export default ChainOverlayLogo;
