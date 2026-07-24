import { CHROME_EXTENSION_URL } from '@revoke.cash/core/constants';
import WalletIndicator from 'components/header/WalletIndicator';
import WalletIndicatorDropdown from 'components/header/WalletIndicatorDropdown';
import { useTranslations } from 'next-intl';
import HeaderLogo from './HeaderLogo';
import MobileMenu from './MobileMenu';
import MoreDropdown from './MoreDropdown';
import NavLink from './NavLink';

const Header = () => {
  const t = useTranslations();

  return (
    <header className="flex justify-between items-center gap-4 lg:gap-8 w-full p-4 lg:px-8 pb-8 relative">
      <div className="flex shrink-0">
        <HeaderLogo />
      </div>
      <div className="flex grow justify-end items-center gap-8 shrink-0">
        <div className="hidden lg:flex justify-end items-center gap-4 flex-wrap">
          <NavLink to={CHROME_EXTENSION_URL} text={t('common.nav.extension')} external />
          <NavLink to="/exploits" text={t('common.nav.exploits')} />
          <NavLink to="/learn" text={t('common.nav.learn')} />
          <NavLink to="/premium" text={t('common.nav.premium')} />
          <MoreDropdown />
        </div>
        <div className="hidden lg:flex justify-end gap-2 min-w-48">
          <WalletIndicator />
        </div>
        <div className="flex lg:hidden justify-end items-center gap-3">
          <WalletIndicatorDropdown compact className="h-8 px-3 text-sm" />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
