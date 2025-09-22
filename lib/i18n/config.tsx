import Href from 'components/common/Href';
import { DISCORD_URL, DONATION_ADDRESS, TWITTER_URL } from 'lib/constants';
import { FAIRSIDE_APP_URL } from 'lib/coverage/fairside';
import type { RichTranslationValues } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export { routing } from './routing';

// TODO: Replace this with the new routing config
export const locales = routing.locales;
export const defaultLocale = routing.defaultLocale;
export const localePrefix = routing.localePrefix;

export type Locale = (typeof routing.locales)[number];

export const defaultTranslationValues: RichTranslationValues = {
  i: (children) => <span className="italic">{children}</span>,
  b: (children) => <span className="font-bold">{children}</span>,
  br: () => <br />,
  ul: (children) => <ul className="list-disc list-inside">{children}</ul>,
  li: (children) => <li className="list-item">{children}</li>,
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
  'what-is-a-cold-wallet': (children) => (
    <Href href="/learn/wallets/what-is-a-cold-wallet" className="font-medium" html underline="hover" router>
      {children}
    </Href>
  ),
  'fairside-link': (children) => (
    <Href href={FAIRSIDE_APP_URL} className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'nexus-link': (children) => (
    <Href href="https://nexusmutual.io" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'bright-union-link': (children) => (
    <Href href="https://brightunion.io" className="font-medium" underline="hover" html external>
      {children}
    </Href>
  ),
  'donations-link': (children) => (
    <Href
      href={`https://etherscan.io/address/${DONATION_ADDRESS}`}
      className="font-medium"
      underline="hover"
      html
      external
    >
      {children}
    </Href>
  ),
  'kerberus-link': (children) => (
    <Href
      href="https://www.kerberus.com/extension/?ref=REVOKECASH"
      className="font-medium"
      underline="hover"
      html
      external
    >
      {children}
    </Href>
  ),
  'pudgy-sbt-link': (children) => (
    <Href
      href="https://opensea.io/item/matic/0xd0eb70639146909a5ee1439da1124cb80af2d0b9/11"
      className="font-medium"
      underline="hover"
      html
      external
    >
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
      domain_checker: (await import(`../../locales/${locale}/domain_checker.json`)).default,
      exploits: (await import(`../../locales/${locale}/exploits.json`)).default,
      extension: (await import(`../../locales/${locale}/extension.json`)).default,
      faq: (await import(`../../locales/${locale}/faq.json`)).default,
      landing: (await import(`../../locales/${locale}/landing.json`)).default,
      learn: (await import(`../../locales/${locale}/learn.json`)).default,
      networks: (await import(`../../locales/${locale}/networks.json`)).default,
      token_approval_checker: (await import(`../../locales/${locale}/token_approval_checker.json`)).default,
      merchandise: (await import(`../../locales/${locale}/merchandise.json`)).default,
      pudgy: (await import(`../../locales/${locale}/pudgy.json`)).default,
    },
    defaultTranslationValues,
  };
});
