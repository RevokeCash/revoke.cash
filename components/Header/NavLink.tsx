import { classNames } from 'lib/utils/classNames';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface Props {
  to: string;
  text: string;
  matchToHighlight?: string;
}

const NavLink = ({ to, text, matchToHighlight }: Props) => {
  const router = useRouter();
  const isActivePath = router.asPath.includes(matchToHighlight);

  return (
    <Link href={to}>
      <a
        className={classNames(
          isActivePath ? 'text-black' : 'text-gray',
          'font-futura italic font-bold text-lg uppercase'
        )}
      >
        {text}
      </a>
    </Link>
  );
};

export default NavLink;
