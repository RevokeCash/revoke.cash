import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import NavLink from './NavLink';

const Header: React.FC = () => {
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
            <NavLink to="/about" text="About" matchToHighlight="about" />
            <NavLink to="/faq" text="FAQ" matchToHighlight="faq" />
            <NavLink to="/extension" text="Extension" matchToHighlight="extension" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
