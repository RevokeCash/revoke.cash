import { type NextIntlClientProvider as InternalProvider, useLocale, useNow, useTimeZone } from 'next-intl';
import type { ComponentProps } from 'react';
import NextIntlClientProviderChild from './NextIntlClientProviderChild';

const NextIntlClientProvider = ({ children, ...props }: ComponentProps<typeof InternalProvider>) => {
  const locale = useLocale();
  const timeZone = useTimeZone();
  const now = useNow();

  return <NextIntlClientProviderChild {...{ ...props, locale, timeZone, now }}>{children}</NextIntlClientProviderChild>;
};

export default NextIntlClientProvider;
