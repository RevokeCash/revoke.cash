'use client';

import ToastifyConfig from 'components/common/ToastifyConfig';
import { QueryProvider } from 'lib/hooks/QueryProvider';
import { ColorThemeProvider } from 'lib/hooks/useColorTheme';
import type { ReactNode } from 'react';
import { EmbedConfigProvider } from '../lib/context';
import { EmbedEthereumProvider } from '../lib/EmbedEthereumProvider';
import type { EmbedConfig } from '../lib/types';
import EmbedHeader from './EmbedHeader';

interface Props {
  children: ReactNode;
  config: EmbedConfig;
}

const EmbedLayout = ({ children, config }: Props) => {
  return (
    <EmbedConfigProvider value={config}>
      <QueryProvider>
        <EmbedEthereumProvider>
          <ColorThemeProvider storageKey="embed-theme">
            <div className="min-h-screen">
              <EmbedHeader />
              <main className="w-full">{children}</main>
            </div>
            <ToastifyConfig />
          </ColorThemeProvider>
        </EmbedEthereumProvider>
      </QueryProvider>
    </EmbedConfigProvider>
  );
};

export default EmbedLayout;
