import ConnectButton from './ConnectButton';
import DonateButton from './DonateButton';

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
