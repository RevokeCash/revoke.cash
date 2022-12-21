import { classNames } from 'lib/utils/styles';
import Link from 'next/link';

interface Props {
  to: string;
  text: string;
  matchToHighlight?: string;
}

const NavLink = ({ to, text }: Props) => {
  const classes = classNames(
    'text-lg text-black visited:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:rounded-md'
  );

  return (
    <Link href={to}>
      <a className={classes}>{text}</a>
    </Link>
  );
};

export default NavLink;
