import React from 'react';
import { Col, Row } from 'react-bootstrap';
import DonateButton from '../DonateButton/DonateButton';
import ConnectButton from './ConnectButton';

const DashboardHeader: React.FC = () => {
  return (
    <Row>
      <Col className="my-auto" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <DonateButton />
        <ConnectButton />
      </Col>
    </Row>
  );
};

export default DashboardHeader;
