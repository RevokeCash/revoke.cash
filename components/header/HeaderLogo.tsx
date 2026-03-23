import Href from 'components/common/Href';
import Image from 'next/image';

const HeaderLogo = () => {
  return (
    <Href href="/" underline="none" className="flex" router>
      <div className="bg-brand px-4 pt-2 pb-3 flex items-center">
        <Image
          src="/assets/images/revoke-wordmark-black.svg"
          alt="Revoke.cash logo"
          height="30"
          width="130"
          className="shrink-0"
          priority
          fetchPriority="high"
        />
      </div>
    </Href>
  );
};

export default HeaderLogo;
