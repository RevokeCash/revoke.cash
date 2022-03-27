import { providers } from 'ethers';
import React from 'react'

export const ProviderContext = React.createContext<providers.BaseProvider | undefined>(undefined);
