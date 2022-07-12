import Link from 'next/link';
import { useRouter } from 'next/router';

interface Props {
  to: string;
  text: string;
  matchToHighlight?: string;
}

const NavLink = ({ to, text, matchToHighlight }: Props) => {
  const router = useRouter();

  const textColor = matchToHighlight ? (router.asPath.includes(matchToHighlight) ? 'black' : 'grey') : 'grey';

  return (
    <Link href={to}>
      <a
        style={{
          color: textColor,
          textTransform: 'uppercase',
          fontFamily: 'Futura Condensed',
          textDecoration: 'none',
          fontWeight: 'bold',
          fontStyle: 'oblique',
          fontSize: '18px',
        }}
      >
        {text}
      </a>
    </Link>
  );
};

export default NavLink;
