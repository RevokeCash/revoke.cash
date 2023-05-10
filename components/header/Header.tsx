import DonateButton from 'components/common/DonateButton';
import Href from 'components/common/Href';
import WalletIndicator from 'components/header/WalletIndicator';
import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';
import MobileMenu from './MobileMenu';
import NavLink from './NavLink';
import SearchBar from './SearchBar';

interface Props {
  searchBar?: boolean;
}

const Header = ({ searchBar = true }: Props) => {
  const { t } = useTranslation();

  return (
    <header className="w-full relative py-8 px-4">
      <div className="flex flex-col gap-4 max-w-6xl mx-auto w-full ">
        <div className="flex justify-between items-center gap-8 ">
          <div className="hidden md:flex justify-start items-center gap-4 w-1/3">
            <DonateButton size="md" />
            <NavLink to="/faq" text={t('common:nav.faq')} />
            <NavLink to="/extension" text={t('common:nav.extension')} />
            <NavLink className="hidden lg:inline-flex" to="/exploits" text={t('common:nav.exploits')} />
          </div>
          <div className="flex md:justify-center grow w-1/3">
            <Href href="/" underline="none" className="flex" router>
              <Image
                src="/assets/images/revoke.svg"
                alt="Revoke.cash logo"
                height="49"
                width="240"
                className="filter dark:invert"
              />
            </Href>
          </div>
          <div className="hidden md:flex justify-end w-1/3 gap-2">
            <WalletIndicator />
          </div>
          <div className="flex md:hidden justify-end">
            <MobileMenu />
          </div>
        </div>
        {searchBar && <SearchBar />}
      </div>
    </header>
  );
};

export default Header;
