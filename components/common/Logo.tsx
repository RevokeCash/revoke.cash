import Image from 'next/image';

interface Props {
  src: string;
  alt: string;
  size?: number;
}

const Logo = ({ src, alt, size }: Props) => (
  <Image
    objectFit="contain"
    src={src}
    alt={alt}
    height={size ?? 24}
    width={size ?? 24}
    quality="100"
    className="rounded-full"
  />
);

export default Logo;
