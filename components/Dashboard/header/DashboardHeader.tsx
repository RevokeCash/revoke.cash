import React from 'react';
import ConnectButton from './ConnectButton';
import DonateButton from './DonateButton';

const DashboardHeader: React.FC = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
      <DonateButton />
      <ConnectButton />
    </div>
  );
};

export default DashboardHeader;
