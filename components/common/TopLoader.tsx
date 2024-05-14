'use client';

import NextTopLoader from 'nextjs-toploader';

const TopLoader = () => {
  // Note that the nextjs-toploader package automatically sets the color to white for dark mode
  return <NextTopLoader color="#000000" shadow={false} showSpinner={false} height={2} />;
};

export default TopLoader;
