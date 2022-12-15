import { classNames } from 'lib/utils/styles';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface Props {
  to: string;
  text: string;
  matchToHighlight?: string;
}

const NavLink = ({ to, text }: Props) => {
  const router = useRouter();

  const classes = classNames(
    // router.asPath === to ? 'text-black visited:text-black' : 'text-gray-500 visited:text-gray-500',
    'text-lg text-black visited:text-black focus:outline-black'
  );

  return (
    <Link href={to}>
      <a className={classes}>{text}</a>
    </Link>
  );
};

export default NavLink;
