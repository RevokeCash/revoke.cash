import React from "react";
import { Col, Row } from "react-bootstrap";
import DonateButton from '../DonateButton/DonateButton';
import ConnectButton from './ConnectButton';

const Header: React.FC = () => {
  return (
    <div style={{ marginTop: '10px', marginBottom: '10px' }}>
      <Row>
        <Col className="my-auto only-desktop" />
        <Col className="my-auto"><img className="logo" src="/revoke.svg" alt="revoke.cash logo"/></Col>
        <Col className="my-auto only-desktop-flex" style={{ justifyContent: 'end', gap: '10px' }}>
          <DonateButton />
          <ConnectButton />
        </Col>
      </Row>
      <Row>
        <Col className="my-auto only-mobile-flex" style={{ justifyContent: 'center', gap: '10px', paddingTop: '10px', paddingBottom: '10px' }}>
          <DonateButton />
          <ConnectButton />
        </Col>
      </Row>
    </div>
  )
}

export default Header
