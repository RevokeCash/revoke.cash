'use client';

import Href from 'components/common/Href';

const PremiumBanner = () => {
  return (
    <div className="flex flex-col text-sm">
      <span>Want a unified view across all networks?</span>
      <Href href="/premium" className="font-medium text-brand" underline="always" router>
        Upgrade to Premium
      </Href>
    </div>
  );
};

export default PremiumBanner;
