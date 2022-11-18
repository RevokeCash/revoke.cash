import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';
import Link from 'next/link';
import NavLink from './NavLink';

const Header = () => {
  const { t } = useTranslation();

  return (
    <header>
      <div className="pt-2 mx-auto">
        <div className="flex place-content-center">
          <div>
            <Link href="/">
              <a>
                <Image src="/assets/images/revoke.svg" alt="Revoke.cash logo" height="81" width="400" />
              </a>
            </Link>
          </div>
        </div>
        <div className="flex justify-center space-x-2">
          <NavLink to="/about" text={t('common:nav.about')} />
          <NavLink to="/faq" text={t('common:nav.faq')} />
          <NavLink to="/extension" text={t('common:nav.extension')} />
        </div>
      </div>
    </header>
  );
};

export default Header;
