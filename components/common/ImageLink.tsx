import Image from 'next/image';

interface Props {
  src: string;
  alt: string;
  href: string;
  height: number;
  width: number;
  label?: string;
}

const ImageLink = ({ src, alt, href, height, width, label }: Props) => (
  <a href={href} target="_blank" className="no-underline">
    <div className="flex flex-col items-center gap-1">
      <Image src={src} alt={alt} objectFit="contain" height={height} width={width} quality="100" />
      {label && <div>{label}</div>}
    </div>
  </a>
);

export default ImageLink;
