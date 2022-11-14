import dynamic from 'next/dynamic';

export const NoSSR = (children: React.ComponentType) => {
  return dynamic(() => Promise.resolve(children), { ssr: false });
};
