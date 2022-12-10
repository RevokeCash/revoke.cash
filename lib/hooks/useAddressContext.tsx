import React, { ReactNode, useContext } from 'react';

interface AddressContext {
  address?: string;
  openSeaProxyAddress?: string;
}

interface Props {
  children: ReactNode;
  value: AddressContext;
}

const AddressContext = React.createContext<AddressContext>({});

export const AddressContextProvider = ({ children, value }: Props) => {
  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
};

export const useAddressContext = () => useContext(AddressContext);
