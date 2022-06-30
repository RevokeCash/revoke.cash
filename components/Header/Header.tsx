import React from 'react';
import { Col, Row } from 'react-bootstrap';
import DonateButton from '../DonateButton/DonateButton';
import ConnectButton from './ConnectButton';

const Header: React.FC = () => {
  return (
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
      <Row>
        <Col className="my-auto">
          <img className="logo" src="/revoke.svg" alt="revoke.cash logo" />
        </Col>
      </Row>
      <Row>
        <Col className="my-auto" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <DonateButton />
          <ConnectButton />
        </Col>
      </Row>
    </div>
  );
};

export default Header;
