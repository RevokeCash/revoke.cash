import Href from 'components/common/Href';
import Image from 'next/image';

const HeaderLogo = () => {
  return (
    <Href href="/" underline="none" className="flex min-w-0" router>
      <div className="bg-brand px-4 pt-2 pb-3 flex items-center min-w-0">
        <Image
          src="/assets/images/revoke-wordmark-black.svg"
          alt="Revoke.cash logo"
          height="30"
          width="130"
          className="min-w-0 h-auto"
          priority
          fetchPriority="high"
        />
      </div>
    </Href>
  );
};

export default HeaderLogo;
