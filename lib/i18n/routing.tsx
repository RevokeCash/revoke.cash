import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'es', 'ja', 'ru', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});
