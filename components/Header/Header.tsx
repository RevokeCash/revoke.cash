import useTranslation from 'next-translate/useTranslation';
import Image from 'next/image';
import Link from 'next/link';
import NavLink from './NavLink';

const Header = () => {
  const { t } = useTranslation();

  return (
    <>
      <div
        className="Header"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'start',
          gap: '10px',
          marginTop: '10px',
          marginBottom: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'start',
            gap: '2px',
          }}
        >
          <div>
            <Link href="/">
              <a>
                <Image
                  className="logo"
                  src="/assets/images/revoke.svg"
                  alt="Revoke.cash logo"
                  height="81"
                  width="400"
                />
              </a>
            </Link>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <NavLink to="/about" text={t('common:nav.about')} matchToHighlight="about" />
            <NavLink to="/faq" text={t('common:nav.faq')} matchToHighlight="faq" />
            <NavLink to="/extension" text={t('common:nav.extension')} matchToHighlight="extension" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
