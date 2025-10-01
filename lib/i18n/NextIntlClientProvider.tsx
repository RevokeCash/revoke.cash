import type { NextIntlClientProvider as InternalProvider } from 'next-intl';
import { getLocale, getNow, getTimeZone } from 'next-intl/server';
import type { ComponentProps } from 'react';
import NextIntlClientProviderChild from './NextIntlClientProviderChild';

const NextIntlClientProvider = async ({ children, ...props }: ComponentProps<typeof InternalProvider>) => {
  const locale = await getLocale();
  const timeZone = await getTimeZone();
  const now = await getNow();

  return <NextIntlClientProviderChild {...{ ...props, locale, timeZone, now }}>{children}</NextIntlClientProviderChild>;
};

export default NextIntlClientProvider;
