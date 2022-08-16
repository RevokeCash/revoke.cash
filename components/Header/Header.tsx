import Link from 'next/link';
import React from 'react';
import { Col, Row } from 'react-bootstrap';
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
      </div>
    </>
  );
};

export default Header;
