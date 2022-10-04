import React from 'react';
import DonateButton from '../DonateButton';
import ConnectButton from './ConnectButton';

const DashboardHeader: React.FC = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
      <DonateButton />
      <ConnectButton />
    </div>
  );
};

export default DashboardHeader;
