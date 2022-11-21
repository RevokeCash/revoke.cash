import { classNames } from 'lib/utils/classNames';
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
    router.asPath === to ? 'text-black visited:text-black' : 'text-gray-500 visited:text-gray-500',
    'font-futura italic font-bold text-lg uppercase hover:text-black duration-100'
  );

  return (
    <Link href={to}>
      <a className={classes}>{text}</a>
    </Link>
  );
};

export default NavLink;
