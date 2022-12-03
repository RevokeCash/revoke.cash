import { fallbackTokenIconOnError } from 'lib/utils/tokens';

interface Props {
  src: string;
  alt: string;
  size?: number;
}

const TokenLogo = ({ src, alt, size }: Props) => (
  <img
    src={src}
    alt={alt}
    height={size ?? 24}
    width={size ?? 24}
    className="aspect-square rounded-full object-cover"
    onError={fallbackTokenIconOnError}
  />
);

export default TokenLogo;
