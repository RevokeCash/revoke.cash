import Image from 'next/image';

interface Props {
  src: string;
  alt: string;
  size?: number;
}

const Logo = ({ src, alt, size }: Props) => (
  <Image
    src={src}
    alt={alt}
    className="h-full"
    height={size ?? 22}
    width={size ?? 22}
    quality="100"
    // style={{ borderRadius: '50%' }}
  />
);

export default Logo;
