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
  const isActivePath = router.asPath == to;
  console.log('isActivePath', isActivePath, router.asPath);

  return (
    <Link href={to}>
      <a
        className={classNames(
          isActivePath ? 'text-black' : 'text-gray-400',
          'font-futura italic font-bold text-lg uppercase hover:text-black duration-100'
        )}
      >
        {text}
      </a>
    </Link>
  );
};

export default NavLink;
