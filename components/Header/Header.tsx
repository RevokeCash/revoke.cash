import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';
import Link from 'next/link';
import DonateButton from './DonateButton';
import NavLink from './NavLink';
import SearchBar from './SearchBar';

const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="flex justify-between items-center gap-8">
      <div className="flex justify-start items-center gap-8 flex-grow">
        <div className="flex flex-shrink-0 cursor-pointer">
          <Link href="/">
            <Image src="/assets/images/revoke.svg" alt="Revoke.cash logo" height="40" width="200" />
          </Link>
        </div>
        <SearchBar />
      </div>
      <div className="flex justify-end items-center gap-4">
        <NavLink to="/about" text={t('common:nav.about')} />
        <NavLink to="/faq" text={t('common:nav.faq')} />
        <NavLink to="/extension" text={t('common:nav.extension')} />
        <DonateButton size="md" />
      </div>
    </header>
  );
};

export default Header;
