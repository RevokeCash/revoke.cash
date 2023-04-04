import Href from './Href';
import Logo from './Logo';

interface Props {
  src: string;
  alt: string;
  href: string;
  size?: number;
  className?: string;
}

const LogoLink = ({ src, alt, href, size, className }: Props) => (
  <Href className="flex" href={href} external>
    <Logo src={src} alt={alt} size={size} className={className} />
  </Href>
);

export default LogoLink;
