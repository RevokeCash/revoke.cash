import Href from 'components/common/Href';
import WalletIndicator from 'components/header/WalletIndicator';
import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';
import DonateButton from '../common/DonateButton';
import MobileMenu from './MobileMenu';
import NavLink from './NavLink';
import SearchBar from './SearchBar';

const Header = () => {
  const { t } = useTranslation();

  return (
    <header className="flex flex-col relative p-4 md:px-8 gap-4">
      <div className="flex justify-between items-center gap-8">
        <div className="hidden md:flex justify-start items-center gap-4 w-1/3">
          <DonateButton size="md" />
          <NavLink to="/faq" text={t('common:nav.faq')} />
          <NavLink to="/extension" text={t('common:nav.extension')} />
        </div>
        <div className="flex md:justify-center grow w-1/3">
          <Href href="/" underline="none" className="flex" router>
            <Image src="/assets/images/revoke.svg" alt="Revoke.cash logo" height="48" width="240" />
          </Href>
        </div>
        <div className="hidden md:flex justify-end w-1/3">
          <WalletIndicator />
        </div>
        <div className="flex md:hidden justify-end">
          <MobileMenu />
        </div>
      </div>
      <div className="flex justify-center">
        <SearchBar />
      </div>
    </header>
  );
};

export default Header;
