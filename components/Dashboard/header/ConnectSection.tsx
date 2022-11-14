import ConnectButton from './ConnectButton';
import DonateButton from './DonateButton';

const ConnectSection = () => {
  return (
    <div
      className="flex  justify-center"
      // style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}
    >
      <DonateButton />
      <ConnectButton />
    </div>
  );
};

export default ConnectSection;
