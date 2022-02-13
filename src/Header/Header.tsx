import React from "react";
import { Col, Row } from "react-bootstrap";
import DonateButton from '../DonateButton/DonateButton';
import ConnectButton from './ConnectButton';

const Header: React.FC = () => {
  return (
    <Row className="Header">
      <Col className="my-auto">
        <div className="only-mobile" style={{ float: 'left' }}><DonateButton /></div>
      </Col>
      <Col className="my-auto"><img className="logo" src="/revoke.svg" alt="revoke.cash logo"/></Col>
      <Col className="my-auto">
        <ConnectButton />
        <div className="only-desktop" style={{ float: 'right', marginRight: '10px' }}><DonateButton /></div>
      </Col>
    </Row>
  )
}

export default Header
