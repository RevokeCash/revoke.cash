import Logo from './Logo';

interface Props {
  src: string;
  alt: string;
  href: string;
  size?: number;
}

const LogoLink = ({ src, alt, href, size }: Props) => (
  <a className="flex" href={href} target="_blank">
    <Logo src={src} alt={alt} size={size} />
  </a>
);

export default LogoLink;
