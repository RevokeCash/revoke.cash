'use client';

import { NextIntlClientProvider as InternalProvider } from 'next-intl';
import type { ComponentProps } from 'react';
import { defaultTranslationValues } from './config';

const NextIntlClientProviderChild = ({ children, ...props }: ComponentProps<typeof InternalProvider>) => {
  return (
    <InternalProvider {...props} defaultTranslationValues={defaultTranslationValues}>
      {children}
    </InternalProvider>
  );
};

export default NextIntlClientProviderChild;
