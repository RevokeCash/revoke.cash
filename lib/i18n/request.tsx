import { getRequestConfig } from 'next-intl/server';
import { type Locale, routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = (await requestLocale) as Locale;

  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: {
      about: (await import(`../../locales/${locale}/about.json`)).default,
      address: (await import(`../../locales/${locale}/address.json`)).default,
      blog: (await import(`../../locales/${locale}/blog.json`)).default,
      common: (await import(`../../locales/${locale}/common.json`)).default,
      exploits: (await import(`../../locales/${locale}/exploits.json`)).default,
      extension: (await import(`../../locales/${locale}/extension.json`)).default,
      faq: (await import(`../../locales/${locale}/faq.json`)).default,
      landing: (await import(`../../locales/${locale}/landing.json`)).default,
      learn: (await import(`../../locales/${locale}/learn.json`)).default,
      networks: (await import(`../../locales/${locale}/networks.json`)).default,
      token_approval_checker: (await import(`../../locales/${locale}/token_approval_checker.json`)).default,
      merchandise: (await import(`../../locales/${locale}/merchandise.json`)).default,
      signatures: (await import(`../../locales/${locale}/signatures.json`)).default,
      pudgy: (await import(`../../locales/${locale}/pudgy.json`)).default,
    },
  };
});
