import Image from 'next/image';

const FarcasterLoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
      <div className="flex flex-col items-center">
        <Image
          src="/assets/images/revoke-icon-orange-black.png"
          alt="Revoke.cash"
          width={80}
          height={80}
          className="animate-spin"
          priority
        />
      </div>
    </div>
  );
};

export default FarcasterLoadingScreen;
