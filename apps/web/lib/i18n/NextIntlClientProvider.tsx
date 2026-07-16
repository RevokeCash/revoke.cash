import { NextIntlClientProvider as InternalProvider } from 'next-intl';
import { getLocale, getNow, getTimeZone } from 'next-intl/server';
import type { ComponentProps } from 'react';

const NextIntlClientProvider = async ({ children, ...props }: ComponentProps<typeof InternalProvider>) => {
  const locale = await getLocale();
  const timeZone = await getTimeZone();
  const now = await getNow();

  return <InternalProvider {...{ ...props, locale, timeZone, now }}>{children}</InternalProvider>;
};

export default NextIntlClientProvider;
