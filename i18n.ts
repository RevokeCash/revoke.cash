import { defaultTranslationValues, locales } from 'lib/i18n/config';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: {
      about: (await import(`./locales/${locale}/about.json`)).default,
      address: (await import(`./locales/${locale}/address.json`)).default,
      blog: (await import(`./locales/${locale}/blog.json`)).default,
      common: (await import(`./locales/${locale}/common.json`)).default,
      exploits: (await import(`./locales/${locale}/exploits.json`)).default,
      extension: (await import(`./locales/${locale}/extension.json`)).default,
      faq: (await import(`./locales/${locale}/faq.json`)).default,
      landing: (await import(`./locales/${locale}/landing.json`)).default,
      learn: (await import(`./locales/${locale}/learn.json`)).default,
      networks: (await import(`./locales/${locale}/networks.json`)).default,
      token_approval_checker: (await import(`./locales/${locale}/token_approval_checker.json`)).default,
      merchandise: (await import(`./locales/${locale}/merchandise.json`)).default,
      // Rename to scam_tracker when ready
      // scam_tracker: (await import(`./locales/${locale}/scam_tracker.json`)).default,
    },
    defaultTranslationValues,
  };
});
