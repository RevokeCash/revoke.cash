import React from 'react';

interface Props {
  children: React.ReactNode;
}

const Container = ({ children }: Props) => {
  return <div className="container mx-auto sm:px-6 lg:px-8">{children}</div>;
};

export default Container;
