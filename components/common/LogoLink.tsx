import Href from './Href';
import Logo from './Logo';

interface Props {
  src: string;
  alt: string;
  href: string;
  size?: number;
}

const LogoLink = ({ src, alt, href, size }: Props) => (
  <Href className="flex" href={href} external>
    <Logo src={src} alt={alt} size={size} />
  </Href>
);

export default LogoLink;
