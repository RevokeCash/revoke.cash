import Href from 'components/common/Href';
import { DISCORD_URL, TWITTER_URL } from 'lib/constants';
import type { RichTranslationValues } from 'next-intl';
import { defineRouting } from 'next-intl/routing';
import { getRequestConfig } from 'next-intl/server';

export const routing = defineRouting({
  locales: ['en', 'es', 'ja', 'ru', 'zh'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
});

// TODO: Replace this with the new routing config
export const locales = routing.locales;
export const defaultLocale = routing.defaultLocale;
export const localePrefix = routing.localePrefix;

export type Locale = (typeof routing.locales)[number];

export const defaultTranslationValues: RichTranslationValues = {
  i: (children) => <span className="italic">{children}</span>,
  b: (children) => <span className="font-bold">{children}</span>,
  'rosco-twitter-link': (children) => (
    <Href href="https://twitter.com/RoscoKalis" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'extension-link': (children) => (
    <Href href="/extension" className="font-medium" underline="hover" html router>
      {children}
    </Href>
  ),
  'learn-link': (children) => (
    <Href href="/learn" className="font-medium" underline="hover" html router>
      {children}
    </Href>
  ),
  'gashawk-link': (children) => (
    <Href href="https://gashawk.io" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'twitter-link': (children) => (
    <Href href={TWITTER_URL} className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'discord-link': (children) => (
    <Href href={DISCORD_URL} className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'ens-link': (children) => (
    <Href href="https://ens.domains" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'uns-link': (children) => (
    <Href href="https://unstoppabledomains.com" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'avvy-link': (children) => (
    <Href href="https://avvy.domains" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'faq-link': (children) => (
    <Href href="/learn/faq" className="font-medium" html underline="hover" router>
      {children}
    </Href>
  ),
  'revoking-approvals': (children) => (
    <Href href="/learn/approvals/how-to-revoke-token-approvals" className="font-medium" html underline="hover" router>
      {children}
    </Href>
  ),
  'what-are-token-approvals': (children) => (
    <Href href="/learn/approvals/what-are-token-approvals" className="font-medium" html underline="hover" router>
      {children}
    </Href>
  ),
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = (await requestLocale) as Locale;

  if (!locale || !routing.locales.includes(locale)) {
    locale = defaultLocale;
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
    },
    defaultTranslationValues,
  };
});
