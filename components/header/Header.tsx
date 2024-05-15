import Button from 'components/common/Button';
import Href from 'components/common/Href';
import WalletIndicator from 'components/header/WalletIndicator';
import { useMessages, useTranslations } from 'next-intl';
import Image from 'next/image';
import DonateButton from '../common/DonateButton';
import MobileMenu from './MobileMenu';
import MoreDropdown from './MoreDropdown';
import NavLink from './NavLink';

const Header = () => {
  const t = useTranslations();
  const messages = useMessages();

  return (
    <header className="flex flex-col relative p-4 lg:px-8 pb-8 gap-4">
      <div className="flex justify-between items-center gap-8">
        <div className="hidden lg:flex justify-start items-center gap-4 w-2/5 flex-wrap">
          <DonateButton size="md" />
          <NavLink to="/extension" text={t('common.nav.extension')} />
          <NavLink to="/exploits" text={t('common.nav.exploits')} />
          <MoreDropdown />
        </div>
        <div className="flex lg:justify-center grow shrink-0 h-12">
          <Href href="/" underline="none" className="flex" router>
            <Image
              src="/assets/images/revoke.svg"
              alt="Revoke.cash logo"
              height="48"
              width="240"
              className="filter dark:invert shrink-0"
              priority
              fetchPriority="high"
            />
          </Href>
        </div>
        <div className="hidden lg:flex justify-end w-2/5 gap-2">
          <WalletIndicator />

          <Href href="/profile" underline="none" className="flex" router>
            <Button size="md">Profile (beta)</Button>
          </Href>
        </div>

        <div className="flex lg:hidden justify-end">
          <MobileMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
