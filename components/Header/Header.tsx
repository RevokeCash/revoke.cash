import Link from 'next/link';
import React from 'react';
import { Col, Row } from 'react-bootstrap';
import DonateButton from '../DonateButton/DonateButton';
import ConnectButton from './ConnectButton';
import NavLink from './NavLink';

const Header: React.FC = () => {
  return (
    <>
      <div
        style={{
          background: 'black',
          color: 'white',
          padding: '10px',
          width: '100vw',
          left: 0,
          top: 0,
          position: 'absolute',
        }}
      >
        Need extra security? Try the new Revoke.cash browser extension.
      </div>
      <div style={{ paddingTop: '10px', paddingBottom: '10px' }}>
        Need extra security? Try the new Revoke.cash browser extension.
      </div>
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
          <Row>
            <Col className="my-auto">
              <Link href="/">
                <a>
                  <img className="logo" src="/assets/images/revoke.svg" alt="Revoke.cash logo" />
                </a>
              </Link>
            </Col>
          </Row>
          <Row>
            <Col className="my-auto" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <NavLink to="/about" text="About" matchToHighlight="about" />
              <NavLink to="/faq" text="FAQ" matchToHighlight="faq" />
              <NavLink to="/extension" text="Extension" matchToHighlight="extension" />
            </Col>
          </Row>
        </div>
        <Row>
          <Col className="my-auto" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
            <DonateButton />
            <ConnectButton />
          </Col>
        </Row>
      </div>
    </>
  );
};

export default Header;
