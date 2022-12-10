import DonateButton from '../../Header/DonateButton';
import ConnectButton from './ConnectButton';

const ConnectSection = () => {
  return (
    <div className="py-2">
      <div className="flex justify-center sm:gap-2 h-10">
        <DonateButton size="md" />
        <ConnectButton />
      </div>
    </div>
  );
};

export default ConnectSection;
