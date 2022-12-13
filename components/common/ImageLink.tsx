import Image from 'next/image';
import Href from './Href';

interface Props {
  src: string;
  alt: string;
  href: string;
  height: number;
  width: number;
  label?: string;
}

const ImageLink = ({ src, alt, href, height, width, label }: Props) => (
  <Href href={href} html underline="none" external>
    <div className="flex flex-col items-center gap-1">
      <Image src={src} alt={alt} objectFit="contain" height={height} width={width} quality="100" />
      {label && <div>{label}</div>}
    </div>
  </Href>
);

export default ImageLink;
