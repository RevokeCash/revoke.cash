import WalletIndicator from 'components/header/WalletIndicator';
import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';
import Link from 'next/link';
import DonateButton from '../common/DonateButton';
import NavLink from './NavLink';
import SearchBar from './SearchBar';

const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="flex justify-between items-center gap-8 px-8 py-4">
      <div className="flex justify-start items-center gap-8 flex-grow">
        <div className="flex shrink-0">
          <Link href="/">
            <a className="flex focus:outline-black">
              <Image src="/assets/images/revoke.svg" alt="Revoke.cash logo" height="36" width="180" />
            </a>
          </Link>
        </div>
        <SearchBar />
      </div>
      <div className="flex justify-end items-center gap-3">
        <NavLink to="/about" text={t('common:nav.about')} />
        <NavLink to="/faq" text={t('common:nav.faq')} />
        <NavLink to="/extension" text={t('common:nav.extension')} />
        <DonateButton size="md" />
        <WalletIndicator />
      </div>
    </header>
  );
};

export default Header;
